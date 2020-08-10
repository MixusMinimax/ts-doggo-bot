"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log("start!");
(async () => {
    let i = 0;
    while (true) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log(`tick ${i++}`);
    }
})();
