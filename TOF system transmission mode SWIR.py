import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit

c = 299792458;                              #Speed of light (m/s)
h = 6.62606957e-34;                         #Plank's constant
q = 1.60217657e-19;                         #Electron charge
eps0 = 8.854187e-12;                        #Permitivity 
 
E_phot_850 = (h*c)/(850e-9)
E_phot_1550 = (h*c)/(1550e-9)


camera_power_dissipation = .5 #watts
modulator_power_dissipation_500MHz = .65 #watt for 1 mm device

total_power_500 = modulator_power_dissipation_500MHz + modulator_power_dissipation_500MHz


modulator_power_dissipation_150MHz = .625 #watt for 2 mm device
total_power_150 = modulator_power_dissipation_150MHz + modulator_power_dissipation_150MHz

Nx_pix = 640                             #No. of pixels in x
Ny_pix = 512                               #No. of pixels in y
a_pix = 20e-6  
array_size = Nx_pix*a_pix


I_dom = .98
M_dom = .4
Cmod = I_dom*M_dom                           #Modulation contrast 
f_mod = 150e6;                                #Modulation freq. (MHz)     
modulator_peak_transmission = .85
      
lambda_mod = c/f_mod;                       #Modulation wavelength (um)
L = (lambda_mod/2.0);                      #Nonambiguity distance range(cm)

####Optical Configuration#####

focal_length = 9e-3 #Focal Length, m

m_d = 2000e-6    #Modulator diameter, m

lam = 1550e-9   #Operational Wavelength, m

aperture_dia = m_d  #Collection Aperture Diameter

Pout = .6   #Average Illumination Power, W

lens_transmission = .95

NA = np.sin(np.arctan(aperture_dia/(2*focal_length))) # Numerical Aperture, AU

d = 1.22*(lam/NA) #Optically Resolvable Spot Size, m

resolvable_pixels = (array_size/d)**2 #Number of optically resolvable 'pixels' as in optically resolvable points in the active modulation region

max_angle = np.rad2deg(np.arctan(array_size/(2*focal_length))) # Max angle out of system, restricted by Focal length and diameter of modulator

FOV = max_angle*2 # Field of View of the system

print("FOV", FOV)
####Scene Configuration####

obj_l = np.arange(1,2,.05) #distance to objct/ranging distance, m
obj_r = .4 #Object reflectivity, assumed



###Scene Imaging Specs###
illum_area = (2*np.tan(np.deg2rad(max_angle))*obj_l)**2
illum_p_density = Pout/illum_area #assuming illumination FOV matched to imaging FOV, W/m

proj_spot_area = (d**2)*((obj_l/focal_length)**2) # single optical "pixel" area when projected onto scene, m^2

pt = proj_spot_area*illum_p_density*obj_r # amount of power contained in projected spot

Pr = Pt*(((aperture_dia/2.0)**2)/(obj_l**2)) #assuming lambertian surface, project reflected power onto sphere

#Pr = Pt*(aperture_dia/(2*obj_l))**2
###Camera Specs###
resp = .98
QE = .8                                   #Quantum efficiency
Frame_rate = 120                            #Frame rate (Hz)
Tint = 3e-3                    #Integration time(s)
num_cam_pix = Nx_pix*Ny_pix                         
dark_counts = 20e3 *Tint
averaging = 1
output_framerate = Frame_rate/(averaging)
read_noise = 90 #e


### Combined performance ###
otp_ratio = num_cam_pix/resolvable_pixels #ratio between optically resolvable points and number of discreet physical pixels on the camera
power_per_pix = (Pr/otp_ratio) # Power per pixel
power_per_pix = power_per_pix*lens_transmission*modulator_peak_transmission

#######################################

#Calculate depth resolution based on power making it to each pixel##

e_pix_L = power_per_pix*Tint*QE/E_phot_1550;       #No. electron for each pixel

pixel_noise = np.sqrt(dark_counts+e_pix_L+read_noise**2) #overall noise of each pixel, shotnoise+darknoise+read_noise
pixel_eff_signal = 2*Cmod*e_pix_L #effectivley the only "signal" we care about is what is modulated

dL_L = ((L)/np.sqrt(8))*(pixel_noise/pixel_eff_signal) #Depth resolution per pixel, cm
dL_L = np.sqrt(dL_L**2)
print('dL_L = ',(dL_L), ' cm');

percent_error = dL_L/obj_l


num_depth_bits = np.log2(1/((percent_error)))



energy_per_pix = ((total_power_150/num_cam_pix)*Tint*4)/num_depth_bits


plt.figure()
plt.plot(obj_l, energy_per_pix*1e9)
plt.xlabel("Distance To Scene (meters)")
plt.ylabel("Energy per Bit (nJ)")
plt.title("SWIR TOF System (2 mm dia. Modulator) \n Mod. Freq = 150 MHz, Avg. LD Power = .6 W")



plt.figure()
plt.plot(obj_l, dL_L*1e2)
plt.xlabel("Distance To Scene (meters)")
plt.ylabel("Depth Resolution (cm)")
plt.title("SWIR TOF System (2 mm dia. Modulator) \n Mod. Freq = 150 MHz, Avg. LD Power = .6 W")




plt.figure()
##plt.plot(obj_l, dL_L)
#plt.plot(measured_l, measured_dl_l)
##
#plt.legend(["Simulated", "Measured"])
#plt.xlabel("Distance From Collection Aperture (m)")
#plt.ylabel("Depth Resolution (cm)")
#plt.title("Modulation Contrast: ~.45, Avg. Illum. Power: 100 mW \n Aperture dia: 22 mm, Modulation Freqeuncy: 150 MHz")
plt.plot(obj_l, percent_error*100)
plt.xlabel("Distance To Scene (M)")
plt.ylabel("Depth Uncertainty (percent of range)")
plt.title("SWIR TOF System (2 mm dia. Modulator) \n Mod. Freq = 150 MHz, Avg. LD Power = .6 W")

