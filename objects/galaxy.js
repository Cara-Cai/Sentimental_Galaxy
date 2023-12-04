import * as THREE from 'three'
import { Vector3 } from "three"
import { Star } from './star.js';
// import { ARMS, ARM_X_DIST, ARM_X_MEAN, ARM_Y_DIST, ARM_Y_MEAN, CORE_X_DIST, CORE_Y_DIST, GALAXY_THICKNESS, NUM_STARS, OUTER_CORE_X_DIST, OUTER_CORE_Y_DIST } from '../config/galaxyConfig.js';
import { ARMS, ARM_X_DIST, ARM_X_MEAN, ARM_Y_DIST, ARM_Y_MEAN, CORE_X_DIST, CORE_Y_DIST, GALAXY_THICKNESS, OUTER_CORE_X_DIST, OUTER_CORE_Y_DIST } from '../config/galaxyConfig.js';
// import { gaussianRandom, spiral } from '../utils.js';
import { gaussianRandom} from '../utils.js';
// import { happyValue } from './face.js';

// import TWEEN from 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js';

const starTypes = {
    percentage : [76.45, 12.1, 7.6, 3.0, 0.6, 0.13],
    // color: [0xffcc6f, 0xffd2a1, 0xfff4ea, 0xf8f7ff, 0xcad7ff, 0xaabfff],
    colorNeutral: [0xe3c759, 0x8a8322, 0xaba924, 0x8bf7eb, 0x4175b5, 0x36c2ab],
    colorHappy:[0xffcc6f, 0xf0d71d, 0xfff4ea, 0x8bf7eb, 0xcad7ff, 0xaabfff],
    colorSad:[0x85f1ff,0x23a2b0,0x1a148f,0x294d91,0x3dc4b7,0x64ede0],
    size: [0.7, 0.7, 1.15, 1.48, 2.0, 2.5, 3.5]
}

const texture = new THREE.TextureLoader().load('../resources/sprite120.png')
const materials = starTypes.colorNeutral.map((color) => new THREE.SpriteMaterial({map: texture, color: color}))


function spiral(x,y,z,offset,spiral) {
    //added

    let r = Math.sqrt(x**2 + y**2)
    let theta = offset
    theta += x > 0 ? Math.atan(y/x) : Math.atan(y/x) + Math.PI
    theta += (r/ARM_X_DIST) * spiral
    return new Vector3(r*Math.cos(theta), r*Math.sin(theta), z)

    
}

export class Galaxy {

    constructor(scene) {

        this.scene = scene
        this.maxStars=7000

        this.currentVisibleStars = 0;
        this.targetVisibleStars = 0;

        this.spiral=2
        this.stars = this.generateObject(this.maxStars, (pos) => new Star(pos))
        this.stars.forEach((star) => {
            star.toThreeObject(scene)
            star.obj.visible = false;
        })
          
    }

 //based on happyValue to show
    // updateStarVisibility(happyValue) {
    //     // Calculate the number of stars to show
    //     const numStarsToShow = Math.floor(happyValue * this.maxStars);
    //     for (let i = 0; i < this.maxStars; i++) {
    //         this.stars[i].obj.visible = i < numStarsToShow;
    //     }
    // }

    updateStarVisibility(happyValue,sadValue,neutralValue) {

        let numStarsToShow;

        if (happyValue > sadValue && happyValue > neutralValue) {
            // Happy state: Range from 5000 to 7000 stars
            numStarsToShow = 3500 + Math.floor(happyValue * 3000);
        } else if (sadValue > happyValue && sadValue > neutralValue) {
            // Sad state: Range from 3500 to 5000 stars, sadder means fewer stars
            numStarsToShow = 3500 - Math.floor(sadValue * 2000);
        } else {
            // Neutral state: Fixed at 5000 stars
            numStarsToShow = 3500;
        }

        this.targetVisibleStars = numStarsToShow;
        this.tweenStarVisibility();
    }


    updateStarColor(happyValue,sadValue,neutralValue,duration) {

        const neutralColors = starTypes.colorNeutral.map(color => new THREE.Color(color));
        const happyColors = starTypes.colorHappy.map(color => new THREE.Color(color));
        const sadColors = starTypes.colorSad.map(color => new THREE.Color(color));

        let targetColors;

            if (happyValue > neutralValue && happyValue > sadValue) {
            targetColors = happyColors;
        } else if (sadValue > neutralValue && sadValue > happyValue) {
            targetColors = sadColors;
        } else {
            targetColors = neutralColors;
        }

        targetColors.forEach((targetColor, index) => {
            const currentColor = materials[index].color;

            new TWEEN.Tween(currentColor)
                .to({ r: targetColor.r, g: targetColor.g, b: targetColor.b }, duration)
                .onUpdate(() => {
                    materials[index].color.set(currentColor);

                    // Optionally update existing stars if their materials should change dynamically
                    this.stars.forEach(star => {
                        if (star.starType === index) {
                            star.obj.material.color.set(currentColor);
                        }
                    });
                })
                .start();
        });
    }




    tweenStarVisibility() {
        // Tween from currentVisibleStars to targetVisibleStars
        const tween = new TWEEN.Tween({ visibleStars: this.currentVisibleStars })
            .to({ visibleStars: this.targetVisibleStars }, 3000) // duration in milliseconds
            .onUpdate((obj) => {
                this.currentVisibleStars = Math.floor(obj.visibleStars);
                for (let i = 0; i < this.maxStars; i++) {
                    this.stars[i].obj.visible = i < this.currentVisibleStars;
                }
            })
            .start();
    }


    updateScale(camera) {
        this.stars.forEach((star) => {
            star.updateScale(camera)
        })

    }


    generateObject(numStars, generator) {
        let objects = []

        for ( let i = 0; i < numStars / 4; i++){
            let pos = new THREE.Vector3(gaussianRandom(0, CORE_X_DIST), gaussianRandom(0, CORE_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS))
            let obj = generator(pos)
            objects.push(obj)
        }

        for ( let i = 0; i < numStars / 4; i++){
            let pos = new THREE.Vector3(gaussianRandom(0, OUTER_CORE_X_DIST), gaussianRandom(0, OUTER_CORE_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS))
            let obj = generator(pos)
            objects.push(obj)
        }

        for (let j = 0; j < ARMS; j++) {
            for ( let i = 0; i < numStars / 4; i++){
                let pos = spiral(gaussianRandom(ARM_X_MEAN, ARM_X_DIST), gaussianRandom(ARM_Y_MEAN, ARM_Y_DIST), gaussianRandom(0, GALAXY_THICKNESS), j * 2 * Math.PI / ARMS,this.spiral)
                let obj = generator(pos)
                objects.push(obj)
            }
        }

        return objects
    }
}