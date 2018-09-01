
function toDegrees (angle) {
    return angle * (180 / Math.PI);
  }


function toRadians (angle) {
    return angle * (Math.PI / 180);
  }

function linspace (a, b, n) {
    if (typeof n === 'undefined') n = Math.max(Math.round(b - a) + 1, 1)
    if (n < 2) {
      return n === 1 ? [a] : []
    }
    var i,ret = Array(n)
    n--
    for (i = n;i >= 0;i--) {
      ret[i] = (i * b + (n - i) * a) / n
    }
    return ret
  }
  

  function div_num_array(num, inp_array){
    num_array = nj.ones(inp_array.shape).multiply(num)
    ret_array = num_array.divide(inp_array.clone())

    return ret_array
  }


  function limit_array_dec(inp_array, num_dec){
    ret_array = inp_array.slice()


    for (i = 0; i < ret_array.length; i++) { 
        ret_array[i] = ret_array[i].toFixed(num_dec)
    }

        return ret_array
  }

c = 299792458;       //Speed of light (m/s)
h = 6.62606957e-34;  //Plank's constant
q = 1.60217657e-19;  //Electron charge
eps0 = 8.854187e-12; //Permitivity 
 
E_phot_850 = (h*c)/(850e-9)
E_phot_1550 = (h*c)/(1550e-9)

camera_power_dissipation = .5 //watts
modulator_power_dissipation_500MHz = .65 //watt for 1 mm device

total_power_500 = modulator_power_dissipation_500MHz + modulator_power_dissipation_500MHz


modulator_power_dissipation_150MHz = .625 //watt for 2 mm device
total_power_150 = modulator_power_dissipation_150MHz + modulator_power_dissipation_150MHz

Nx_pix = 640                             //No. of pixels in x
Ny_pix = 512                               //No. of pixels in y
a_pix = 20e-6  
array_size = Nx_pix*a_pix


I_dom = .98
M_dom = .4
Cmod = I_dom*M_dom                           //Modulation contrast 
f_mod = 350e6;                                //Modulation freq. (MHz)     
modulator_peak_transmission = .85
      
lambda_mod = c/f_mod;                       //Modulation wavelength (um)
L = (lambda_mod/2.0);                      //Nonambiguity distance range(cm)



////////Optical Configuration//////////

focal_length = 9e-3 //Focal Length, m

m_d = 1000e-6    //Modulator diameter, m

lam = 1550e-9   //Operational Wavelength, m

aperture_dia = m_d  //Collection Aperture Diameter

Pout = 1.2   //Average Illumination Power, W

lens_transmission = .95

NA = Math.sin(Math.atan(aperture_dia/(2*focal_length))) // Numerical Aperture, AU

d = 1.22*(lam/NA) //Optically Resolvable Spot Size, m

resolvable_pixels = (array_size/d)**2 //Number of optically resolvable 'pixels' as in optically resolvable points in the active modulation region

max_angle = toDegrees(Math.atan(array_size/(2*focal_length))) // Max angle out of system, restricted by Focal length and diameter of modulator

FOV = max_angle*2 // Field of View of the system


////////Scene Configuration////////

obj_l = nj.arange(1,5,.25)//distance to objct/ranging distance, m

obj_r = .6 //Object reflectivity, assumed



//////Scene Imaging Specs//////


illum_area = obj_l.multiply(2*Math.tan(toRadians(max_angle))).pow(2)

illum_p_density = div_num_array(Pout, illum_area)




proj_spot_area = obj_l.divide(focal_length).pow(2).multiply(d**2) // single optical "pixel" area when projected onto scene, m^2

Pt = proj_spot_area.multiply(illum_p_density).multiply(obj_r) // amount of power contained in projected spot


Pr = Pt.multiply(div_num_array(((aperture_dia/2.0)**2), obj_l.pow(2))) //assuming lambertian surface, project reflected power onto sphere

//////Camera Specs//////
resp = .98
QE = .8                                   //Quantum efficiency
Frame_rate = 120                            //Frame rate (Hz)
Tint = 6e-3                    //Integration time(s)
num_cam_pix = Nx_pix*Ny_pix                         
dark_counts = 20e3 *Tint
averaging = 1
output_framerate = Frame_rate/(averaging)
read_noise = 90 //e


////// Combined performance //////
otp_ratio = num_cam_pix/resolvable_pixels //ratio between optically resolvable points and number of discreet physical pixels on the camera
power_per_pix = (Pr.divide(otp_ratio)) // Power per pixel
power_per_pix = power_per_pix.multiply(lens_transmission*modulator_peak_transmission)

//////////////////////////////////////////////////////////////////////////////

//Calculate depth resolution based on power making it to each pixel////

e_pix_L = power_per_pix.multiply(Tint*QE).divide(E_phot_1550);       //No. electron for each pixel

pixel_noise = e_pix_L.add(dark_counts).add(read_noise**2).sqrt() //overall noise of each pixel, shotnoise+darknoise+read_noise

pixel_eff_signal = e_pix_L.multiply(2*Cmod) //effectivley the only "signal" we care about is what is modulated

dL_L = (pixel_noise.divide(pixel_eff_signal)).multiply(((L)/Math.sqrt(8))) //Depth resolution per pixel, cm
dL_L = dL_L.multiply(1e2)
console.log(dL_L)


percent_error = dL_L.divide(obj_l)
num_depth_bits = (div_num_array(1,percent_error))
num_depth_bits = num_depth_bits.log(2)

console.log(num_depth_bits)

energy_per_pix =  div_num_array(((total_power_150/num_cam_pix)*Tint*4),num_depth_bits).multiply(1e9)

var depth_res = dL_L.tolist()
var e_per_b = energy_per_pix.tolist()
var depths = obj_l.tolist()

depths = limit_array_dec(depths, 2)



//



//



//var myHeading = document.querySelector('h1');
//myHeading.textContent = "Depth Resolution : " + dL_L.get(1)*1e3 + " mm";






var config = {
    type: 'line',
    data: {
        labels:depths,
        datasets: [{
            label: 'Depth Resolution',
            backgroundColor: 'rgba(53, 130, 177, 0.9)',
            borderColor: 'rgba(53, 130, 177, 0.9)',
            data: depth_res,
            fill: false,
            yAxisID: 'y-axis-1',
        }, {
            label: 'Energy Per Bit',
            fill: false,
            backgroundColor: 'rgba(164, 134, 42, 0.9)',
            borderColor: 'rgba(164, 134, 42, 0.9)',
            data: e_per_b,
            yAxisID: 'y-axis-2',
        }]
    },
    options: {


        title: {
            display: true,
            text: 'TOF Camera Depth Resolution',
            fontColor: 'rgba(210, 210, 210, 1)',
            fontSize: 18
        },
        tooltips: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },

        legend: {
            display: false,
            labels: {
                fontColor: "white",
                fontSize: 18
            }
        },
        scales: {
            xAxes: [{
                display: true,

                ticks: {
                    fontColor: 'rgba(210, 210, 210, 1)',
                    fontSize: 15
                }, 
                scaleLabel: {
                    display: true,
                    labelString: 'Distance (m)',
                    fontColor: 'rgba(210, 210, 210, 1)',
                    fontSize: 20
                },
                gridLines: {
                    color: 'rgba(180, 180, 180, 1)' // makes grid lines from y axis red
                  }
            }],
            yAxes: [{
                display: true,
                position: 'left',
				id: 'y-axis-1',

                ticks: {
                    fontColor: 'rgba(210, 210, 210, 1)',
                    fontSize: 15
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Depth Resolution (cm)',
                    fontColor: 'rgba(210, 210, 210, 1)',
                    fontSize: 20
                },
                gridLines: {
                    color: 'rgba(180, 180, 180, 1)' // makes grid lines from y axis red
                  }
            },
            {
                display: true,
                position: 'right',
				id: 'y-axis-2',
                ticks: {
                    fontColor: 'rgba(210, 210, 210, 1)',
                    fontSize: 15
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Energy Per Bit (nJ)',
                    fontColor: 'rgba(210, 210, 210, 1)',
                    fontSize: 20
                },
                gridLines: {
                    color: 'rgba(180, 180, 180, 1)' // makes grid lines from y axis red
                  }
            }
        
        ]
        }
    }
};


function fitToContainer(canvas){
    // Make it visually fill the positioned parent
    canvas.style.width ='100%';
    canvas.style.height='100%';
    // ...then set the internal size to match
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }


var schem_canavs = document.getElementById("schem_canvas");



fitToContainer(schem_canavs)



var ctx = schem_canavs.getContext("2d");
ctx.fillStyle = "#FF0000";
ctx.strokeRect(0,0,150,75);


var sch1 = new schObj("test", 1, 100, 100, 1,1)

sch1.drawObject = new function(){
    ctx.strokeRect(sch1.x,sch1.y, sch1.x+sch1.width,sch1.y+sch1.height);
    console.log("We did it")

}

sch1.drawObject
window.onload = function() {
    var ctx = document.getElementById('chart_canvas').getContext('2d');
    window.myLine = new Chart(ctx, config);
};
