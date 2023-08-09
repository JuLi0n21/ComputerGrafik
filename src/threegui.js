import ThreeMeshUI from 'three-mesh-ui'
import * as THREE from 'three';
import { RRT } from './rrt';
import { RRTStar } from './rrtstar';

let currentshit;
const raycaster = new THREE.Raycaster
const objsToTest = []
let selectState = false;
let rrtcanvas = new THREE.Group();

export function algoGUI(scene, obsticals) {
    const container = new ThreeMeshUI.Block({
        height: 1.5,
        width: 1
    });

    container.position.set(0, 1, -1.8);
    container.rotation.x = -0.55;
    scene.add(container);

    const imageBlock = new ThreeMeshUI.Block({
        height: 1,
        width: 1,
        offset: 0.01 // distance separating the inner block from its parent
    });

    const textBlock = new ThreeMeshUI.Block({
        height: 0.4,
        width: 0.8,
        margin: 0.05, // like in CSS, horizontal and vertical distance from neighbour
        offset: 0.01 // distance separating the inner block from its parent
    });

    container.add(imageBlock, textBlock);

    container.set({
        fontFamily: '../assests/Roboto-msdf.json',
        fontTexture: '../assests/Roboto-msdf.png',
    });

    const text = new ThreeMeshUI.Text({
        content: 'Waehle Geometry.'
    });

    textBlock.add(text);

    text.set({
        fontColor: new THREE.Color(0xd2ffbd),
        fontSize: 0.04
    });

    textBlock.set({
        // alignContent: 'right', // could be 'center' or 'left'
        // alignContent has been deprecated, rely on alignItems or textAlign
        textAlign: 'right',
        justifyContent: 'end', // could be 'start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'  
        padding: 0.03
    });

    
	const meshContainer = new THREE.Group();
	meshContainer.position.set( 0, 1, -1.9 );
	scene.add( meshContainer );

	//

	const sphere = new THREE.Mesh(
		new THREE.IcosahedronBufferGeometry( 0.3, 1 ),
		new THREE.MeshStandardMaterial( { color: 0x3de364, flatShading: true } )
	);

	const box = new THREE.Mesh(
		new THREE.BoxBufferGeometry( 0.45, 0.45, 0.45 ),
		new THREE.MeshStandardMaterial( { color: 0x643de3, flatShading: true } )
	);

	const cone = new THREE.Mesh(
		new THREE.ConeBufferGeometry( 0.28, 0.5, 10 ),
		new THREE.MeshStandardMaterial( { color: 0xe33d4e, flatShading: true } )
	);

	//


	sphere.visible = box.visible = cone.visible = false;

	meshContainer.add( sphere, box, cone );

	const meshes = [ sphere, box, cone ];
	let currentMesh = 0;

	showMesh( currentMesh );

	//////////
	// Panel
	//////////

	makePanel();

    function showMesh( id ) {

        meshes.forEach( ( mesh, i ) => {
    
            mesh.visible = i === id ? true : false;
    
        } );
    
    }

    function addpoints( ) {
        currentshit.addNodes(20);
       
    }

    function renderalgo( id ) {
        
        scene.remove(rrtcanvas);
        rrtcanvas = new THREE.Group;
     

        if(id == 0) {
            const start = [-1, 2, 3];
            const goal = [-2, 2, 0];
            const maxStepSize = 0.2;
            const maxStepCount = 1000;
            const range = 6;
           
            const rrt = new RRT(start, goal, obsticals, maxStepSize, maxStepCount, range, rrtcanvas);
            
           // rrt.visulize();
           rrt.addNodes(1000); 
           currentshit = rrt;
           console.log("Startign RRT")
            
            scene.add(rrtcanvas);
        }

        if(id == 1) {
            const start = [1, 1];
            const goal = [2, -2];
            const maxStepSize = 0.2;
            const maxStepCount = 1000;
            const range = 6;
           
            const rrtstar = new RRTStar(start, goal, obsticals, maxStepSize, maxStepCount, range, rrtcanvas);
            currentshit = rrtstar;
            rrtstar.visualize();
            console.log("Startign RRT")
            
            scene.add(rrtcanvas);
        }
    }

    function makePanel() {

        // Container block, in which we put the two buttons.
        // We don't define width and height, it will be set automatically from the children's dimensions
        // Note that we set contentDirection: "row-reverse", in order to orient the buttons horizontally
    
        const container = new ThreeMeshUI.Block( {
            justifyContent: 'center',
            contentDirection: 'row-reverse',
            fontFamily: "../assests/Roboto-msdf.json",
            fontTexture: "../assests/Roboto-msdf.png",
            fontSize: 0.07,
            padding: 0.02,
            borderRadius: 0.11
        } );
    
        container.position.set( 0, 0.6, -1.2 );
        container.rotation.x = -0.55;
        scene.add( container );
    
        // BUTTONS
    
        // We start by creating objects containing options that we will use with the two buttons,
        // in order to write less code.
    
        const buttonOptions = {
            width: 0.4,
            height: 0.15,
            justifyContent: 'center',
            offset: 0.05,
            margin: 0.02,
            borderRadius: 0.075
        };
    
        // Options for component.setupState().
        // It must contain a 'state' parameter, which you will refer to with component.setState( 'name-of-the-state' ).
    
        const hoveredStateAttributes = {
            state: 'hovered',
            attributes: {
                offset: 0.035,
                backgroundColor: new THREE.Color( 0x999999 ),
                backgroundOpacity: 1,
                fontColor: new THREE.Color( 0xffffff )
            },
        };
    
        const idleStateAttributes = {
            state: 'idle',
            attributes: {
                offset: 0.035,
                backgroundColor: new THREE.Color( 0x666666 ),
                backgroundOpacity: 0.3,
                fontColor: new THREE.Color( 0xffffff )
            },
        };
    
        // Buttons creation, with the options objects passed in parameters.
    
        const buttonNext = new ThreeMeshUI.Block( buttonOptions );
        const buttonPrevious = new ThreeMeshUI.Block( buttonOptions );
    
        const buttonRender = new ThreeMeshUI.Block( buttonOptions );
        // Add text to buttons
    
        buttonNext.add(
            new ThreeMeshUI.Text( { content: 'switch Algo' } )
        );  
        buttonPrevious.add(
            new ThreeMeshUI.Text( { content: 'addNodes' } )
        );   

        buttonRender.add(
            new ThreeMeshUI.Text( { content: "start" } )
        );

        // Create states for the buttons.
        // In the loop, we will call component.setState( 'state-name' ) when mouse hover or click
        const selectedAttributes = {
            offset: 0.02,
            backgroundColor: new THREE.Color( 0x777777 ),
            fontColor: new THREE.Color( 0x222222 )
        };
        buttonNext.setupState( {
            state: 'selected',
            attributes: selectedAttributes,
            onSet: () => {
    
                currentMesh = ( currentMesh + 1 ) % 3;
                showMesh( currentMesh );
                console.log("Click")
            }
        } );
        buttonNext.setupState( hoveredStateAttributes );
        buttonNext.setupState( idleStateAttributes );
        //
        buttonPrevious.setupState( {
            state: 'selected',
            attributes: selectedAttributes,
            onSet: () => {
    
               /* currentMesh -= 1;
                if ( currentMesh < 0 ) currentMesh = 2;
                showMesh( currentMesh );
                */
               if(currentshit) {
                
                rrtcanvas.clear();
                
                addpoints();
                
               }

            }
        } );
        buttonPrevious.setupState( hoveredStateAttributes );
        buttonPrevious.setupState( idleStateAttributes );
        //
        buttonRender.setupState( {
            state: 'selected',
            attributes: selectedAttributes,
            onSet: () => {
    
               renderalgo(currentMesh);
    
            }
        } );
        buttonRender.setupState( hoveredStateAttributes );
        buttonRender.setupState( idleStateAttributes );
        //
        container.add( buttonNext,  buttonRender, buttonPrevious );
        objsToTest.push( buttonNext, buttonPrevious, buttonRender );
    
    }


}

export function updateButtons(renderer,vrControl,controllerID) {
	// Find closest intersecting object
	let intersect;
	if ( renderer.xr.isPresenting ) {
		vrControl.setFromController( controllerID, raycaster.ray );
		intersect = raycast();
		// Position the little white dot at the end of the controller pointing ray
		if ( intersect ) vrControl.setPointerAt( controllerID, intersect.point );
	} 
	// Update targeted button state (if any)
	if ( intersect && intersect.object.isUI ) {
		if ( vrControl.controllers[controllerID].userData.selected ) {
			// Component.setState internally call component.set with the options you defined in component.setupState
			intersect.object.setState( 'selected' );
            vrControl.controllers[controllerID].userData.selected = false;
		} else {
			// Component.setState internally call component.set with the options you defined in component.setupState
			intersect.object.setState( 'hovered' );
		}
	}
	// Update non-targeted buttons state
	objsToTest.forEach( ( obj ) => {
		if ( ( !intersect || obj !== intersect.object ) && obj.isUI ) {
			// Component.setState internally call component.set with the options you defined in component.setupState
			obj.setState( 'idle' );
		}
	} );
}

function raycast() {
	return objsToTest.reduce( ( closestIntersection, obj ) => {
		const intersection = raycaster.intersectObject( obj, true );
		if ( !intersection[ 0 ] ) return closestIntersection;
		if ( !closestIntersection || intersection[ 0 ].distance < closestIntersection.distance ) {
			intersection[ 0 ].object = obj;
			return intersection[ 0 ];
		}
		return closestIntersection;
	}, null );

}
