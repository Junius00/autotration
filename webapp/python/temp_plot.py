import numpy as np
import matplotlib.pyplot as plt
my_data=np.genfromtxt("titraResult.csv",delimiter=",")
plt.plot()
vol=my_data[:,0]
pH=my_data[:,1]

plt.plot(vol, pH, "b.", label="data")
plt.xlabel("Volume [ml]")
plt.ylabel("pH")
plt.savefig("pHgraph")
