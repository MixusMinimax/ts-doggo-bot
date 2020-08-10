import { time } from "console"

console.log("start!");

(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log("tick")
})();