

export function CUtoModelTime(x){ //900 -> 12
    let mins = x % 100, hours = Math.trunc(x / 100);
    return ((hours-8)*12) + Math.trunc(mins/5);
}
export function ModelToCUTime(x){ //12 -> 900
    let mins = x % 12, hours = Math.trunc(x/12);
    return ((hours+8)*100) + (mins*5);
}

export async function getPreScheduleClass(name){
    const res1 = await fetch("https://classes.colorado.edu/api/?page=fose&route=search&alias=" + name, {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Access-Control-Allow-Origin": "http://127.0.0.1:3000",
        },
        
    });
    console.log(res1);
    const res = await res1.json();
    console.log(res);
    return {};
}