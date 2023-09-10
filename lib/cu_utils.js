

export function CUtoModelTime(x){ //900 -> 12
    let mins = x % 100, hours = Math.trunc(x / 100);
    return ((hours-8)*12) + Math.trunc(mins/5);
}
export function ModelToCUTime(x){ //12 -> 900
    let mins = x % 12, hours = Math.trunc(x/12);
    return ((hours+8)*100) + (mins*5);
}

export function getPreScheduleClass(name){
    
}