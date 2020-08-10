import { time } from "console"

console.log("start!");

(async () => {
    let i = 0
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log(`tick ${i++}`)
    }
})();