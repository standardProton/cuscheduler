

export function renderSchedule(canvas: HTMLCanvasElement){
    const ctx = canvas.getContext("2d");
    if (ctx == null) return;
    ctx.fillStyle = "#FEFEFE";
    ctx.font = "11pt Ariel";

    const wraw = canvas.width, hraw = canvas.height, marginxp = 0, marginyp = 0, 
        marginx = marginxp*wraw, marginy = marginyp*hraw, 
        w = (1-(2*marginxp))*wraw, h = (1-(2*marginyp))*hraw;

    console.log("wraw = " + wraw + ", hraw = " + hraw + ", owo=true")

    for (let i = 0; i < 11; i++){
        const y = marginy + (i*(h-5)/10.0);
        //ctx.fillText((((i+7) % 12) + 1) + ":00", marginx, y+5);
        ctx.fillRect(marginx, y, w, 1);

    }

    for (let i = 0; i < 6; i++){
        const x = marginx + (i*(w-1)/5.0);
        ctx.fillRect(x, marginy, 1, h + 10);
    }

}