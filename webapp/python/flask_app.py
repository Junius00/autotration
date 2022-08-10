import flask, serial, time
from flask import Flask, render_template, request

app=Flask(__name__)

#Homepage global variables
codeDict={"Up":"101", "Lower": "102", "Laser":"103", "pH": "104", "Stop":"201", "Drop":"105", "LongDrip":"106"}
ButtonTable={'Up':"Up",'Lower':"Lower until meets float",'Laser':"Calibrate Laser",'pH':"Calibrate pH",'Stop':"Stop",'Drop':"Start Drop Sequence"}
ButtonList=list(ButtonTable.items())
linkButton=["Laser","pH","Drop"]

#Serial setup global variables
arduino=None

#Laser calibration global variables
volume=0
distance=0
conversion=0.09336099585062244

#pH calibration global variables
pHcaliList=["Remaining: ","pH4","pH7"]
analogCaliDict={"pH4":-1, "pH7":-1}
gradient=0
y_intercept=0

#Drop sequence variables
titraResult=[]
dropEnd=0
mode="LongDrip"
prev_mode="Drop"

#Serial communication functions
def SerialWrite(code):
    global arduino
    arduino.write(bytes(code,"utf-8"))
    
def Serialwrite(code):      #obsolete function that combines write and receive
    global arduino
    arduino.write(bytes(code,"utf-8"))
    time.sleep(1)
    received=arduino.readline()
    return received.decode("utf-8")

def SerialReceiveTest():        #for testing serial output only
    global arduino
    while True:
        print(arduino.read().decode("utf-8"))

def SerialReceiveln():
    global arduino
    received=""
    while "\n" not in received:
        received=received+arduino.read().decode("utf-8")
    return received

#pH calculation function   
def calpH(a):
    global gradient, y_intercept
    a=float(a.strip("\\r\\n"))
    return gradient*a+y_intercept

#Webapp functions
@app.route("/",methods=["GET","POST"])
def setup():
    if request.method=="GET":
        return render_template("setup.html", prompt="Please enter Arduino Port number, in the format of 'COMx'", connected=0)
    elif request.method=="POST":
        port=request.form["port"]
        try:
            global arduino
            arduino=serial.Serial(port=port, baudrate=115200, timeout=1)
            return render_template("setup.html", prompt="Successfully connected to Arduino!", connected=1)
        except:
            return render_template("setup.html", prompt="Wrong Port number! Please try again in the format of 'COMx'", connected=0)
    
@app.route("/homepage/",methods=["GET","POST"])
def index():
    global linkButton
    if request.method=="POST":
        for command in request.form:    # request.form is a dictionary, with button names as keys, button values as items
            if command not in linkButton:
                print("{} command received".format(command))
                SerialWrite(codeDict[command])#this part not needed already, since all buttons except for stop are URL now
                print("Board return: ", SerialReceiveln()) # put this in frontend instead of here
    return render_template("homepage.html", ButtonList=ButtonList, linkButton=linkButton)

@app.route("/pH/", methods=["GET","POST"])      #Make sure the pH calibration sequence returns "200" and analog values 
def pH():
    prompt="pH calibration sequence starts. Please put the pH probe in the following buffer(s) before clicking the corresponding start button."
    global pHcaliList, analogCaliDict, gradient, y_intercept
    if request.method=="GET":
        analog_pH="NA"
    elif request.method=="POST": #assuming that the board returns 200 for signalReceived() before returning the pH values
        if "clear" in request.form:
            pHcaliList=["Remaining: ","pH4","pH7"]
            gradient=0
            y_intercept=0
            analog_pH="NA"
        else:
            SerialWrite(codeDict["pH"])
            print("Board return: ", SerialReceiveln())
            for command in request.form:
                analog_pH=SerialReceiveln()
                analogCaliDict[command]=float(analog_pH)
                try:
                    pHcaliList.remove(command)
                except:
                    prompt="This pH value has already been calibrated!"
            if len(pHcaliList)==1:
                SerialWrite(codeDict["Stop"])
                gradient=3/(analogCaliDict["pH7"]-analogCaliDict["pH4"])
                y_intercept=7-gradient*analogCaliDict["pH7"]
                pHcaliList.pop()
                pHcaliList.append("Completed! Please return to homepage with the link below.")
    return render_template("pHcalibration.html", prompt=prompt, analog_pH=analog_pH, testList=pHcaliList)


@app.route("/Laser/", methods=["GET","POST"])
def Laser():
    global volume, distance, conversion
    prompt="Please enter the current burette reading before clicking start."
    if request.method=="POST":
        for action in request.form:
            if action=="initial":
                volume=float(request.form[action])
                prompt="Lowering laser. Click 'end' when appropriate."
                SerialWrite(codeDict["Laser"])
                print("Board return: ", SerialReceiveln())
            elif action=="end":
                prompt="Please submit the final burette reading."
                SerialWrite(codeDict["Stop"])
                print("Board return: ", SerialReceiveln())
                distance=float(SerialReceiveln())
                print(distance)
            elif action=="final":
                prompt="Laser module calibration completed. Please return to homepage."
                volume=float(request.form[action])-volume
                print(volume)
                conversion=volume/distance
                print("Volume: {} Distance: {} Conversion: {}".format(volume, distance, conversion))
    return render_template("laserCalibration.html", prompt=prompt)

@app.route("/Drop/", methods=["GET","POST"])
def Drop():
    global titraResult, dropEnd, conversion, mode, prev_mode
    interval=0
    if request.method=="GET":
        prompt="Make everything is ready before starting the drop sequence. Click 'End' to complete titration. Click 'Refresh Results' to check titration progress."
    elif request.method=="POST":
        prompt="Click 'End' to complete titration. Click 'Refresh Results' to check titration progress."
        for action in request.form:
            if action=="start":
                while not dropEnd:
                    print(mode)
                    SerialWrite(codeDict[mode])
                    print("Board return: ", SerialReceiveln())
                    result=SerialReceiveln().split("|")     #assuming the result comes in the format of "distance|pH"
                    result[0]=float(result[0])*conversion
                    result[1]=calpH(result[1])
                    titraResult.append(result)       #'titraresult' stores data in the formate of [[volume,pH],[volume,pH],...]
                    print(result)
                print(titraResult)
            elif action=="end":
                dropEnd=1
                prompt="Drop sequence ended. Return to homepage for more options."
            elif action=="switch":
                temp=prev_mode
                prev_mode=mode
                mode=temp
            elif action=="clear":
                titraResult=[]
                dropEnd=0
                mode="LongDrip"
                prev_mode="Drop"
    return render_template("dropSeq.html", prompt=prompt, titraResult=titraResult)

#execute main function
if __name__=="__main__":
    app.run()
