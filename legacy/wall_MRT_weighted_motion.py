import serial # import Serial Library
import numpy  # Import numpy
import matplotlib.pyplot as plt #import matplotlib library
from drawnow import *
from mpl_toolkits.mplot3d import Axes3D
import matplotlib.pyplot as plt
import matplotlib.cm as cmx
from scipy.stats import norm
import matplotlib.cm as cmx
import matplotlib
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
 
tempC= []
x = []
y = []
z = []
arduinoData = serial.Serial('/dev/cu.usbserial-AM01R0P2', 9600) #Creating our serial object named arduinoData
plt.ion() #Tell matplotlib you want interactive mode to plot live data
cnt=0
def makeFig(): #Create a function that makes our desired plot
    fig = plt.figure(figsize=(5*3.13,3*3.13))
    colorsMap='jet'
    cm = plt.get_cmap(colorsMap)
    cNorm = matplotlib.colors.Normalize(vmin=23, vmax=30)
    scalarMap = cmx.ScalarMappable(norm=cNorm, cmap=cm)
    ax = fig.add_subplot(111, projection='3d')
    ax.scatter(x, z, y, c=scalarMap.to_rgba(tempC), marker='o')
    scalarMap.set_array(tempC)
    fig.colorbar(scalarMap)
    ax.text(1, 1, 1, MRT, color='green', fontsize=15)
    #ax.set_xlabel('X Label')
    #ax.set_ylabel('Y Label')
    #ax.set_zlabel('Z Label')
    
    plt.show()
    #plt.plot(tempF, 'ro-', label='Degrees F')
    
 
while True: # While loop that loops forever
    while (arduinoData.inWaiting()==0): #Wait here until there is data
        pass #do nothing
    arduinoString = arduinoData.readline() #read the line of text from the serial port
    dataArray = arduinoString.split(',')   #Split it into an array called dataArray
    temp = float( dataArray[2])            #Convert first element to floating number and put in temp
    MRT = numpy.mean(tempC)
    MRT = format(MRT, '.2f')
    theta = (float(dataArray[0]))*numpy.pi/180          #Convert second element to floating number and put in P
    
    phi = (float(dataArray[1])-90)*numpy.pi/180
    x_new = numpy.sin(phi)*numpy.cos(theta)
    y_new = numpy.sin(phi)*numpy.sin(theta)
    z_new = numpy.cos(phi)
    
    tempC.append(temp)                     #Build our tempF array by appending temp readings
    x.append(x_new)
    y.append(y_new)
    z.append(z_new)
    if theta == 0 or theta < -1.57:
    	plt.close()
    	drawnow(makeFig)                      #Call drawnow to update our live graph
    	plt.pause(.000001)                     #Pause Briefly. Important to keep drawnow from crashing
    
    cnt=cnt+1
    if cnt >1922:
    	cnt = 0
    	tempC = []
    	x = []
    	y = []
    	z = []