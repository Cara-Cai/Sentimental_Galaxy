import * as THREE from 'three'
import { BLOOM_LAYER, STAR_MAX, STAR_MIN } from '../config/renderConfig.js'
// import { starTypes } from '../config/starDistributions.js'
import { clamp } from '../utils.js'

const starTypes = {
    percentage : [76.45, 12.1, 7.6, 3.0, 0.6, 0.13],
    // color: [0xffcc6f, 0xffd2a1, 0xfff4ea, 0xf8f7ff, 0xcad7ff, 0xaabfff],
    colorNeutral: [0xe3c759, 0x8a8322, 0xaba924, 0x8bf7eb, 0x4175b5, 0x36c2ab],
    colorHappy:[0xffcc6f, 0xf0d71d, 0xfff4ea, 0x8bf7eb, 0xcad7ff, 0xaabfff],
    colorSad:[0x85f1ff,0x23a2b0,0x1a148f,0x294d91,0x3dc4b7,0x64ede0],
    size: [0.7, 0.7, 1.15, 1.48, 2.0, 2.5, 3.5]
}


// const texture = new THREE.TextureLoader().load('../resources/sprite120.png')
const texture = new THREE.TextureLoader().load('https://cara-cai.github.io/Sentimental_Galaxy/resources/sprite120.png')
const materials = starTypes.colorNeutral.map((color) => new THREE.SpriteMaterial({map: texture, color: color}))
const deltaTime=10

// const starTypes = {
//     percentage : [76.45, 12.1, 7.6, 3.0, 0.6, 0.13],
//     // color: [0xffcc6f, 0xffd2a1, 0xfff4ea, 0xf8f7ff, 0xcad7ff, 0xaabfff],
//     color: [0xffcc6f, 0x5e1fa, 0xfff4ea, 0x8bf7eb, 0xcad7ff, 0xaabfff],
//     size: [0.7, 0.7, 1.15, 1.48, 2.0, 2.5, 3.5]
// }



export class Star {

    constructor(position) {
        this.position = position
        this.starType = this.generateStarType()
        this.obj = null
        // this.time=0
        // this.veriticalSpeed=10;

        this.intensity = Math.random()*30
        this.ran = Math.random()
        

        // ///////////////////////
        //float
        this.initialZ = position.z; // Store initial Z position
        this.time = Math.random() * Math.PI * 2; // Initialize time for oscillation
        this.verticalSpeed = 0.002; // Adjust the speed of the vertical movement
    }

    generateStarType() {
        let num = Math.random() * 100.0
        let pct = starTypes.percentage
        for (let i = 0; i < pct.length; i++) {
            num -= pct[i]
            if (num < 0) {
                return i
            }
        }
        return 0
    }

    updateScale(camera) {

        if(this.obj) {
        let dist = this.position.distanceTo(camera.position) / 250

        // update star size
        let starSize = 1.2*dist * starTypes.size[this.starType]
        starSize = clamp(starSize, STAR_MIN, STAR_MAX)
        this.obj?.scale.copy(new THREE.Vector3(starSize, starSize, starSize))

        // ///////////////////////////////////////
        //float
        this.time += deltaTime; // Increment time based on deltaTime
        // Calculate vertical offset using a sine function
        const verticalOffset = Math.sin(this.time * this.verticalSpeed*this.ran)*this.intensity; // Adjust amplitude as needed
        // Update star's Z position
        this.obj.position.setZ(this.initialZ + verticalOffset);
        }

    }

    // updateStarColor(happyValue,sadValue,neutralValue,duration) {

    //     const neutralColors = starTypes.colorNeutral.map(color => new THREE.Color(color));
    //     const happyColors = starTypes.colorHappy.map(color => new THREE.Color(color));
    //     const sadColors = starTypes.colorSad.map(color => new THREE.Color(color));

    //     let targetColors;

    //         if (happyValue > neutralValue && happyValue > sadValue) {
    //         targetColors = happyColors;
    //     } else if (sadValue > neutralValue && sadValue > happyValue) {
    //         targetColors = sadColors;
    //     } else {
    //         targetColors = neutralColors;
    //     }

    //     targetColors.forEach((targetColor, index) => {
    //         const currentColor = materials[index].color;

    //         new TWEEN.Tween(currentColor)
    //             .to({ r: targetColor.r, g: targetColor.g, b: targetColor.b }, duration)
    //             .onUpdate(() => {
    //                 materials[index].color.set(currentColor);

    //                 // Optionally update existing stars if their materials should change dynamically
    //                 galaxy.stars.forEach(star => {
    //                     if (star.starType === index) {
    //                         star.obj.material.color.set(currentColor);
    //                     }
    //                 });
    //             })
    //             .start();
    //     });
    // }




    toThreeObject(scene) {
        let sprite = new THREE.Sprite(materials[this.starType])
        sprite.layers.set(BLOOM_LAYER)
        
        sprite.scale.multiplyScalar(starTypes.size[this.starType])
        sprite.position.copy(this.position)

        this.obj = sprite

        scene.add(sprite)
    }
}
