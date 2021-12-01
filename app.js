import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec3,vec4 } from "../../libs/MV.js";
import {modelView, loadMatrix, multMatrix, multRotationY, multRotationX, multRotationZ, multScale, pushMatrix, popMatrix, multTranslation} from "../../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CUBE from '../../libs/cube.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as PYRAMID from '../../libs/pyramid.js';
import * as TORUS from '../../libs/torus.js';



/** @type {WebGLRenderingContext} */

//const VP_DISTANCE = 10;
const N_GROUND_SQUARES = 50;
const SQUARE_SIZE = 1;
const WHEEL_SIZE = 1;
const PADDING = 0.2;
const TANK_X = 2.5;
const TANK_Y = 2.0;
const TANK_Z = 6.0;
const TANK_TOP_X = 3.8;
const TANK_TOP_Y = 1.7;
const TANK_TOP_Z = 5.8;
const CABINET_X = 3.0;
const CABINET_Y = 3.0;
const CABINET_Z = 3.6;
const LAUNCHER_X = 0.45;
const LAUNCHER_Y = 5.0;
const LAUNCHER_Z = 0.45;
const ROCKET_X = 0.50;
const ROCKET_Y = 0.1;
const ROCKET_Z = 0.50;
const FRONT_TANK_X = 3.8;
const FRONT_TANK_Y = 2.0;
const FRONT_TANK_Z = 4.5;
const EXIS_X = 3.4;
const EXIS_Y = 0.7;
const EXIS_Z = 0.7;




var gl;
var program;
var mode;
var currMode;

var currPerspective;
var perspectives = ["front","top","side","axonometric"];
var groundColors = [vec4(0.0,0.0,0.5,1.0),vec4(1.0,0.0,0.0,1.0)];

var VP_DISTANCE = 14;
var eye = [];
//var at = [];
//var up = [];

var x = 0, y = 0, z = 0;
var currZ = 0;
var wheelRotation = 0;
var cannonRotationX = 0;
var cannonRotationY = 0;
var rocketsShot = 0;
var launchTimes = [];

var clickedUp = false;
var clickedToShoot = false;
var clickedDown = false;
var scopedRight = false; 
var scopedLeft = false; 
var scopedUp = false; 
var scopedDown = false; 


let time = 1;  

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader_ground.vert"], shaders["shader_ground.frag"]);

    let mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);

    mode = gl.TRIANGLES; 
    currMode = mode;

    eye = [VP_DISTANCE,0,0]; //initial view - side view (can be switched using 1,2,3,4)


    resize_canvas();
    window.addEventListener("resize", resize_canvas);    

    document.onkeydown = function(event) {
        
        //console.log(event.key);
        
        switch(event.key) {
            case 'w':
                scopedUp = true;
                //console.log(cannonRotationX);
                break;
            case 'W':
                currMode = gl.LINES;
                break;
            case 's':
                scopedDown = true; 
                break;
            case 'S':
                currMode = gl.TRIANGLES;
                break;
            case 'a':
                scopedLeft = true; 
                break;
            case 'd':
                scopedRight = true; 
                break;
            case ' ': //space
                clickedToShoot = true;  
                rocketsShot++;
                launchTimes.push(time);
                break;
            case 'ArrowUp': //up arrow
                clickedUp = true;
                break;        
            case 'ArrowDown': //down arrow
                clickedDown = true;
                break;
            case '1':
                eye = [0,0,-VP_DISTANCE]; //front view
                currPerspective = perspectives[0];
                break;
            case '2':
                eye = [0,VP_DISTANCE,0.1]; //top view
                currPerspective = perspectives[1];
                break;
            case '3':
                eye = [VP_DISTANCE,0,0]; //side view
                currPerspective = perspectives[2];
                break;
            case '4':
                eye = [VP_DISTANCE,VP_DISTANCE,VP_DISTANCE]; //axonometric view
                currPerspective = perspectives[3];
                break;
            case '+':
                let maxZoom = 3;
                if(currPerspective==perspectives[3]){
                    maxZoom = 7;
                }
                else{
                    maxZoom = 6;
                }
                if(VP_DISTANCE>maxZoom){
                    VP_DISTANCE--;
                }
                mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
                break;
            case '-':
                VP_DISTANCE++;
                mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
                break;
        }
    }

    document.onkeyup = function(event) {
        
        //console.log(event.key);
        
        switch(event.key) {
            case 'w':
                scopedUp = false; 
                break;
            case 's':
                scopedDown = false; 
                break;
            case 'a':
                scopedLeft = false; 
                break;
            case 'd':
                scopedRight = false; 
                break;   
            case 'ArrowUp': //up arrow
                clickedUp = false;
                wheelRotation=0;
                currZ=0;
                break;        
            case 'ArrowDown': //down arrow
                clickedDown = false;
                wheelRotation=0;
                currZ=0;
                break;
            case ' ': //space 
                //clickedToShoot = false;
                break;
        }
    }

    gl.clearColor(0.0, 0.1, 0.7, 0.5);
    SPHERE.init(gl);
    CUBE.init(gl);
    PYRAMID.init(gl);
    TORUS.init(gl);
    CYLINDER.init(gl);
    
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function drawGround(lenX, lenY){

        mode = gl.TRIANGLES;

        // Draw each cub which will represent the ground

        const uColor = gl.getUniformLocation(program, "uColor");

        if( lenX % 2 == 0 && lenY % 2 == 0 ){
            gl.uniform4f(uColor, 1.0, 0.0, 0.0, 0.5); // Red
        }
        else if(lenX % 2 != 0 && lenY % 2 == 0){
            gl.uniform4f(uColor, 0.0, 1.0, 0.0, 0.5); // Green            
        }
        else if(lenX % 2 == 0 && lenY % 2 != 0){
            gl.uniform4f(uColor, 0.0, 1.0, 0.0, 0.5); // Red
        }
        else if(lenX % 2 != 0 && lenY % 2 != 0){
            gl.uniform4f(uColor, 1.0, 0.0, 0.0, 0.5); // Green            
        }

        pushMatrix();
        multScale([SQUARE_SIZE,0.1,SQUARE_SIZE]);
        multTranslation([lenX,-0.1,lenY]);
        uploadModelView();
        CUBE.draw(gl, program, mode);

    }

    function ground(){
        for(let i=-N_GROUND_SQUARES/2; i<N_GROUND_SQUARES/2; i++){
            for(let i2=-N_GROUND_SQUARES/2; i2<N_GROUND_SQUARES/2; i2++){
              pushMatrix();
              drawGround(i,i2);
              popMatrix();
            }    
          }
    }

    function tank(){
        const uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4f(uColor, 0.1, 0.1, 0.1, 0.5); // Grey

        mode = currMode;

        pushMatrix();

        move();
        
        pushMatrix();
        multTranslation([0,WHEEL_SIZE*2-PADDING,0]);
        multScale([TANK_X,TANK_Y,TANK_Z]);
        uploadModelView();
        CUBE.draw(gl, program, mode);
        popMatrix();

        gl.uniform4f(uColor, 0.3, 0.3, 0.3, 0.8); // ??

        pushMatrix();
        multTranslation([0,TANK_TOP_Y+PADDING*3,0]);
        multScale([TANK_TOP_X,TANK_TOP_Y,TANK_TOP_Z]);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();

        front();
        back();
        cabinet();
        wheels();

        popMatrix();
    }

    function front(){
        const uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4f(uColor, 0.3, 0.3, 0.3, 0.8); //dark gray
    
        pushMatrix();
        multTranslation([0,WHEEL_SIZE*2.2,-TANK_Z/2.5]);
        multScale([FRONT_TANK_X,FRONT_TANK_Y,FRONT_TANK_Z]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
    }

    function back(){
        const uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4f(uColor, 0.3, 0.3, 0.3, 0.8); //dark gray
    
        pushMatrix();
        multTranslation([0,WHEEL_SIZE*2.2,TANK_Z/2.5]);
        multScale([FRONT_TANK_X,FRONT_TANK_Y,FRONT_TANK_Z]);
        uploadModelView();
        SPHERE.draw(gl, program, mode);
        popMatrix();
    }

    function cabinet(){
        const uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4f(uColor, 0.2, 0.2, 0.2, 0.35); //light gray

        pushMatrix();
        multRotationY(cannonRotationY); //rotates the cabinet around the Y exis (the sphere and the cylinder as a whole)
        uploadModelView;
        
        pushMatrix();
        multTranslation([0,TANK_Y+WHEEL_SIZE,0]);
        multScale([CABINET_X,CABINET_Y,CABINET_Z]);
        uploadModelView();
        SPHERE.draw(gl, program, mode); 
        popMatrix();

        gl.uniform4f(uColor, 0.2, 0.2, 0.2, 0.45); //light gray

        pushMatrix();
        multTranslation([0,4.0,-1.5]);
        multRotationX(-75);
        multRotationX(cannonRotationX); //rotates only the tank launcher around the X exis, moving up and down while the sphere remains still.
        multScale([LAUNCHER_X,LAUNCHER_Y,LAUNCHER_Z]);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        
        //if(clickedToShoot){
        shootRockets();
                
        popMatrix();    

        popMatrix();
        
        
        //falta desenhar mais um cilindro para fazer a boca do canhao
    }

    function wheels(){ 
        exis();
        rightWheels();
        leftWheels(); 
        
    }

    function exis(){
        const uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4f(uColor, 0.1, 0.1, 0.1, 1.0);
        

        pushMatrix();
        multTranslation([0,WHEEL_SIZE/2+PADDING/2,WHEEL_SIZE*2+PADDING]);
        multScale([EXIS_X,EXIS_Y,EXIS_Z]);
        multRotationZ(-90);
        multRotationY(wheelRotation);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([0,WHEEL_SIZE/2+PADDING/2,WHEEL_SIZE-PADDING]);
        multScale([EXIS_X,EXIS_Y,EXIS_Z]);
        multRotationZ(-90);
        multRotationY(wheelRotation);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
        
        pushMatrix();
        multTranslation([0,WHEEL_SIZE/2+PADDING/2,-WHEEL_SIZE+PADDING*2]);
        multScale([EXIS_X,EXIS_Y,EXIS_Z]);
        multRotationZ(-90);
        multRotationY(wheelRotation);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([0,WHEEL_SIZE/2+PADDING/2,-WHEEL_SIZE*2]);
        multScale([EXIS_X,EXIS_Y,EXIS_Z]);
        multRotationZ(-90);
        multRotationY(wheelRotation);
        uploadModelView();
        CYLINDER.draw(gl, program, mode);
        popMatrix();
    }

    function rightWheels(){
        const uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4f(uColor, 0.2, 0.2, 0.2, 0.85);

        pushMatrix();
        multTranslation([1.2,0.6,WHEEL_SIZE*2+PADDING]);
        multRotationZ(-90);
        multScale([WHEEL_SIZE,1.5,WHEEL_SIZE]);
        multRotationY(wheelRotation);
        uploadModelView();
        TORUS.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([1.2,0.6,WHEEL_SIZE-PADDING]);
        multRotationZ(-90);
        multScale([WHEEL_SIZE,1.5,WHEEL_SIZE]);
        multRotationY(wheelRotation);
        uploadModelView();
        TORUS.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([1.2,0.6,-WHEEL_SIZE+PADDING*2]);
        multRotationZ(-90);
        multScale([WHEEL_SIZE,1.5,WHEEL_SIZE]);
        multRotationY(wheelRotation);
        uploadModelView();
        TORUS.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([1.2,0.6,-WHEEL_SIZE*2]);
        multRotationZ(-90);
        multScale([WHEEL_SIZE,1.5,WHEEL_SIZE]);
        multRotationY(wheelRotation);
        uploadModelView();
        TORUS.draw(gl, program, mode);
        popMatrix();       
    }
    
    function leftWheels(){
        const uColor = gl.getUniformLocation(program, "uColor");
        gl.uniform4f(uColor, 0.2, 0.2, 0.2, 0.85);

        pushMatrix();
        multTranslation([-1.2,0.6,WHEEL_SIZE*2+PADDING]);
        multRotationZ(-90);
        multScale([WHEEL_SIZE,1.5,WHEEL_SIZE]);
        multRotationY(wheelRotation);
        uploadModelView();
        TORUS.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([-1.2,0.6,WHEEL_SIZE-PADDING]);
        multRotationZ(-90);
        multScale([WHEEL_SIZE,1.5,WHEEL_SIZE]);
        multRotationY(wheelRotation);
        uploadModelView();
        TORUS.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([-1.2,0.6,-WHEEL_SIZE+PADDING*2]);
        multRotationZ(-90);
        multScale([WHEEL_SIZE,1.5,WHEEL_SIZE]);
        multRotationY(wheelRotation);
        uploadModelView();
        TORUS.draw(gl, program, mode);
        popMatrix();

        pushMatrix();
        multTranslation([-1.2,0.6,-WHEEL_SIZE*2]);
        multRotationZ(-90);
        multScale([WHEEL_SIZE,1.5,WHEEL_SIZE]);
        multRotationY(wheelRotation);
        uploadModelView();
        TORUS.draw(gl, program, mode);
        popMatrix();
    }

    function move(){
        multTranslation([x, y, z]);

        if(clickedUp){
            if(currZ<-0.6){
                z-=0.13;   
                currZ-=0.13;     
                wheelRotation-=45;                                       
            }
            else if(currZ<-0.5){
                z-=0.09;  
                currZ-=0.09;      
                wheelRotation-=35;                                       
            }
            else if(currZ<-0.4){
                z-=0.07;                                
                currZ-=0.07;
                wheelRotation-=25;                                       
            }
            else if(currZ<-0.3){
                z-=0.05; 
                currZ-=0.05;     
                wheelRotation-=15;                                                 
            }
            else{
                z-=0.03;
                currZ-=0.03;
                wheelRotation-=5;                                       
            }
        }
        if(clickedDown){
            if(currZ>0.6){
                z+=0.13;    
                currZ+=0.13;    
                wheelRotation+=55;                                                               
            }
            else if(currZ>0.5){
                z+=0.09;  
                currZ+=0.09;                              
                wheelRotation+=35;                                       
            }
            else if(currZ>0.4){
                z+=0.07;    
                currZ+=0.07;                         
                wheelRotation+=25;                                          
            }
            else if(currZ>0.3){
                z+=0.05;
                currZ+=0.05;     
                wheelRotation+=15;                                                  
            }
            else{
                z+=0.04;
                currZ+=0.04;
                wheelRotation+=5;                                       
            }    
        }

        if(scopedUp){
            if(cannonRotationX<30){
                cannonRotationX+=2.5;
            }
        }
        if(scopedDown){
            if(cannonRotationX>-10){
                cannonRotationX-=2.5;
            }
        }
        if(scopedLeft){
            //if(cannonRotationY<){
                cannonRotationY+=2.5;
            //}
        }
        if(scopedRight){
            //if(cannonRotationY>){
                cannonRotationY-=2.5;
            //}
        }
    }

    function shootRockets(){
        const uColor = gl.getUniformLocation(program, "uColor");

        for(let i = 0; i<rocketsShot; i++){
            //rocket
            pushMatrix();
            multTranslation([0,-0.6 + 0.5*launchTimes[i],0.0]);
            uploadModelView();

            gl.uniform4f(uColor, 0.75, 0.05, 0.05, 0.9); //ton of red
            

            pushMatrix();
            multTranslation([0,0.50,0.0]);
            multScale([ROCKET_X,ROCKET_Y,ROCKET_Z]);
            uploadModelView();
            CYLINDER.draw(gl, program, mode);
            popMatrix();

            gl.uniform4f(uColor, 0.9, 0.7, 0.0, 0.9); //orange
            
            pushMatrix();
            multTranslation([0,0.55,0.0]);
            multScale([ROCKET_X,ROCKET_Y,ROCKET_Z]);
            uploadModelView();
            SPHERE.draw(gl, program, mode);
            popMatrix();

            popMatrix();

        }
    }

    function render()
    {
        time += 0.1;

        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniform1f(gl.getUniformLocation(program,"time"), false, flatten(time))

        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
        
        loadMatrix(lookAt(eye, [0,0,0], [0,1,0])); //top view
        //loadMatrix(lookAt([0,0,-VP_DISTANCE], [0,0,0], [0,1,0])); //front view
        
        pushMatrix()
        multTranslation([0,PADDING/1.6,0]);
        tank();
        popMatrix();

        ground();
        
    }


}



const urls = ["shader_ground.vert", "shader_ground.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))