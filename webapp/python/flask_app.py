import flask, serial, time, json, io
from flask import Flask, render_template, request, send_file, redirect
from os import path
import numpy as np
from scipy.optimize import curve_fit
#from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from matplotlib import pyplot as plt
plt.switch_backend('agg')

app=Flask(__name__)

#Homepage global variables
codeDict={"Up":"101", "Lower": "102", "Laser":"103", "pH": "104", "Stop":"201", "Drop":"105", "LongDrip":"106", "pHStab":"107"}
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
gradient=-0.02602
y_intercept=20.69362

#Drop sequence variables
titraResult=[]
dropEnd=0
mode="LongDrip"
prev_mode="Drop"
accVolume=0
pH0=0.2
gradient0=1
numpyResult=np.array([])                #empty np array for storing data. When filled, columns are [volume, pH, delta, gradient]

#Value saving functions
FNAME_DEFAULT = './values.json'
def save_json(fname=FNAME_DEFAULT):
    obj = dict(
        volume=volume,
        distance=distance,
        conversion=conversion,
        analogCaliDict=analogCaliDict,
        gradient=gradient,
        y_intercept=y_intercept
    )

    with open(fname, 'w') as f:
        json.dump(obj, f)
    
def read_json(fname=FNAME_DEFAULT):
    global volume, distance, conversion, analogCaliDict, gradient, y_intercept
    
    obj = {}

    if path.exists(fname):        
        with open(fname, 'r') as f:
            obj = json.load(f)
        
        volume = obj.get('volume', 0)
        distance = obj.get('distance', 0)
        conversion = obj.get('conversion', 0)
        analogCaliDict = obj.get('analogCaliDict', {"pH4":-1, "pH7":-1})
        gradient = obj.get('gradient', 0)
        y_intercept = obj.get('y_intercept', 0)
    
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

#pH plot function
def sigmoid(x, L ,x0, k, b):
    y = L / (1 + np.exp(-k*(x-x0))) + b
    return (y)

def pHplot(titraResult, withCurve=0):
    if not titraResult:
        return "null"
    
    tR = np.array(titraResult)
    vol=tR[:,0]
    pH=tR[:,1]

    plt.plot(vol, pH, "b.", label="data")
    if withCurve:
        try:
            p0 = [max(pH), np.median(vol),1,min(pH)]
            popt, pcov = curve_fit(sigmoid, vol, pH, p0, method='dogbox')
            x=np.linspace(min(vol), max(vol), 1000)
            y=sigmoid(x, *popt)
            plt.plot(x,y,label="fit")
        except:
            print("could not fit curve")

    fname = './pHgraph.png'
    plt.savefig(fname)

    return fname

#Numpy processing function
def getGradient(numpyResult):                                   #calculates gradient of the titration graph
    if np.shape(numpyResult)==(1,4):
        return numpyResult
    else:
        rawData=numpyResult[:,:3]
        gradient=np.transpose(np.array([np.gradient(rawData[:,1], rawData[:,0])]))
        return np.append(rawData, gradient, axis=1)

def rowAppend(numpyResult, row):                                #append list 'row' to the np array 'numpyResult'
    if np.shape(numpyResult)==(0,):
        return np.array([row])
    else:
        pHdelta=row[1]-numpyResult[-1,1]
        row[2]=pHdelta
        return np.append(numpyResult, np.array([row]), axis=0)

#Drop seq change mode function
def checkpH(numpyResults, pH0):
    if np.shape(numpyResult) in [(0,),(1,4)]:
        return False
    else:
        pHdifference=numpyResults[-1][1]-numpyResults[-2][1]
        return pHdifference>=pH0

def checkGradient(numpyResults, gradient0):
    if np.shape(numpyResult)==(0,):
        return False
    else:
        return numpyResults[-1][-1]>=gradient0

#Graph fit functions

#pH stabilisation functions
def pHstab(n):
    global codeDict
    SerialWrite(codeDict["pHStab"])
    stabList=[]
    for i in range(n):
        stabList.append(calpH(SerialReceiveln()))
    return stabList

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
    if arduino==None:
        return redirect("http://127.0.0.1:5000/")
    else:
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
    if arduino==None:
        return redirect("http://127.0.0.1:5000/")
    else:
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
                    save_json()
                    
        return render_template("pHcalibration.html", prompt=prompt, analog_pH=analog_pH, testList=pHcaliList)


@app.route("/Laser/", methods=["GET","POST"])
def Laser():
    global volume, distance, conversion
    prompt="Please enter the current burette reading before clicking start."
    if arduino==None:
        return redirect("http://127.0.0.1:5000/")
    else:
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

                    save_json()
                    print("Volume: {} Distance: {} Conversion: {}".format(volume, distance, conversion))
        return render_template("laserCalibration.html", prompt=prompt)


@app.route("/Drop/", methods=["GET","POST"])
def Drop():
    global titraResult, dropEnd, conversion, mode, prev_mode, accVolume, numpyResult, pH0, gradient0
    if arduino==None:
        return redirect("http://127.0.0.1:5000")
    else:
        fname = 'null'
        if request.method=="GET":
            prompt="Make everything is ready before starting the drop sequence. Click 'End' to complete titration. Click 'Refresh Results' to check titration progress."
        elif request.method=="POST":
            prompt="Click 'End' to complete titration. Click 'Refresh Results' to check titration progress."
            for action in request.form:
                if action=="start":
                    #pHstab(2)
                    while not dropEnd:
                        #Switch from long drip to dropwise
                        if (checkpH(numpyResult, pH0) or checkGradient(numpyResult, gradient0)) and mode=="LongDrip":
                            temp=prev_mode
                            prev_mode=mode
                            mode=temp
                        #Switch from dropwise to long drip
                        if (not (checkpH(numpyResult, pH0) or checkGradient(numpyResult, gradient0))) and mode=="Drop":
                            temp=prev_mode
                            prev_mode=mode
                            mode=temp
                        print(mode)
                        SerialWrite(codeDict[mode])
                        print("Board return: ", SerialReceiveln())
                        result = SerialReceiveln()
                        print(result)
                        result = result.split("|")     #assuming the result comes in the format of "distance|pH"
                        delta=float(result[0])*conversion
                        accVolume+=delta
                        result[0]=accVolume
                        result[1]=calpH(result[1])
                        result.append(0)
                        result.append(0)
                        numpyResult=rowAppend(numpyResult, result)
                        print(numpyResult)
                        numpyResult=getGradient(numpyResult)
                        #titraResult.append(result)       #'titraresult' stores data in the formate of [[volume,pH],[volume,pH],...]
                        print(result)
                    print(numpyResult)
                elif action=="end":
                    dropEnd=1
                    prompt="Drop sequence ended. Return to homepage for more options."
                    np.savetxt("titraResult.csv", numpyResult, fmt="%10.3f", delimiter=",")
                elif action=="switch":
                    temp=prev_mode
                    prev_mode=mode
                    mode=temp
                elif action=="clear":
                    titraResult=[]
                    dropEnd=0
                    mode="LongDrip"
                    prev_mode="Drop"
                    accVolume=0
                    numpyResult=np.array([])
            fname = pHplot(titraResult, dropEnd)
            save_json()
            titraResult=numpyResult.tolist()
        return render_template("dropSeq.html", prompt=prompt, titraResult=titraResult, fname=fname)

def plot_png():
    print("fucjk you")
    output = io.BytesIO()
    FigureCanvas(plt.gcf()).print_png(output)
    return Response(output.getvalue(), mimetype='image/png')

@app.route("/graphs/<fname>")
def get_graph(fname):
    return send_file(fname)

#execute main function
if __name__=="__main__":
    read_json()
    app.run()
