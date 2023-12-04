// import { Vector3 } from "three"
// import { ARM_X_DIST} from "./config/galaxyConfig.js"

export function gaussianRandom(mean=0, stdev=1) {
    let u = 1 - Math.random()
    let v = Math.random()
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)

    return z * stdev + mean
}

export function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value))
}
