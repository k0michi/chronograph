import { useEffect, useRef, useState } from 'react';

const ratio = window.devicePixelRatio ?? 1;

export default function Root() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [current, setCurrent] = useState<number>(Date.now());
  const handler = useRef<number>();
  const [range, setRange] = useState<TimeRange>(TimeRange.Day);

  function stop() {
    window.cancelAnimationFrame(handler.current!);
  }

  function tick() {
    const canvasElem = canvas.current!;
    const ctx = canvasElem.getContext('2d')!;
    const now = Date.now();
    setCurrent(now);
    ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);
    ctx.lineWidth = 2;

    const beginningD = new Date();

    switch (range) {
      case TimeRange.Year:
        beginningD.setMonth(0);
      case TimeRange.Month:
        beginningD.setDate(0);
      case TimeRange.Day:
        beginningD.setHours(0);
      case TimeRange.Hour:
        beginningD.setMinutes(0);
      case TimeRange.Minute:
        beginningD.setMilliseconds(0);
        beginningD.setSeconds(0);
    }

    const beginning = beginningD.getTime();
    const endingD = new Date(beginning);

    switch (range) {
      case TimeRange.Year:
        endingD.setFullYear(endingD.getFullYear() + 1);
        break;
      case TimeRange.Month:
        endingD.setMonth(endingD.getMonth() + 1);
        break;
      case TimeRange.Day:
        endingD.setDate(endingD.getDate() + 1);
        break;
      case TimeRange.Hour:
        endingD.setHours(endingD.getHours() + 1);
        break;
      case TimeRange.Minute:
        endingD.setMinutes(endingD.getMinutes() + 1);
        break;
    }

    let scales;

    switch (range) {
      case TimeRange.Year:
        scales = 12;
        break;
      case TimeRange.Month:
        scales = daysInMonth();
        break;
      case TimeRange.Day:
        scales = 24;
        break;
      case TimeRange.Hour:
        scales = 60;
        break;
      case TimeRange.Minute:
        scales = 60;
        break;
    }

    for (let i = 0; i < scales + 1; i++) {
      ctx.strokeStyle = `lightgray`;
      const x = canvasElem.width * i / scales;
      ctx.beginPath();
      ctx.moveTo(x, canvasElem.height);
      ctx.lineTo(x, canvasElem.height - 8);
      ctx.stroke();
    }

    const ending = endingD.getTime();

    let i = laps.length - 1;
    while (i >= 0 && laps[i].time > beginning) {
      ctx.strokeStyle = `hsl(${i * 37},90%,70%)`;
      const x = canvasElem.width * ((laps[i].time - beginning) / (ending - beginning));
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasElem.height);
      ctx.stroke();
      i--;
    }

    const x = canvasElem.width * ((now - beginning) / (ending - beginning));
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasElem.height);
    ctx.stroke();

    handler.current = window.requestAnimationFrame(tick);
  }

  useEffect(() => {
    stop();
    handler.current = window.requestAnimationFrame(tick);
  }, [laps, range]);

  useEffect(() => {
    const sLaps = localStorage.getItem('laps');

    if (sLaps != null) {
      setLaps(JSON.parse(sLaps));
    }

    return () => stop();
  }, []);

  const lapsReversed = [...laps];
  lapsReversed.reverse();

  return <>
    <canvas width={400 * ratio} height={30 * ratio} ref={canvas} onClick={e => {
      setRange((range + 1) % 5);
    }} />
    <div className='clock'>{formatDate(new Date(current))}</div>
    <div>
      <button onClick={e => {
        const newLaps = [...laps];
        const now = Date.now();
        newLaps.push({time:now});
        setLaps(newLaps);
        localStorage.setItem('laps', JSON.stringify(newLaps));
      }}>Lap</button>
    </div>
    <table>
      <thead><tr><th>#</th><th>Laps</th><th>Δ Now</th><th>Δ Previous</th></tr></thead>
      <tbody>
        {lapsReversed.map((l, i) => {
          const nowSpan = makeTimeSpan(l.time - current);
          const nowString = timeSpanToString(nowSpan);
          let previousString = '';

          if (i < lapsReversed.length - 1) {
            const previousSpan = makeTimeSpan(lapsReversed[i].time - lapsReversed[i + 1].time);
            previousString = timeSpanToString(previousSpan, true);
          }

          const number = lapsReversed.length - i;

          return <tr key={number}><td style={{ background: `hsl(${number * 37},90%,70%)` }}>{number}</td><td>{formatDate(new Date(l.time))}</td><td>{nowString}</td><td>{previousString}</td><td><input value={l.note} type="text" onChange={e=>{
            const note = e.target.value;
            const newLaps = [...laps];
            newLaps[number - 1].note = note;
            setLaps(newLaps);
            localStorage.setItem('laps', JSON.stringify(newLaps));
          }} /></td><td className="remove"><button onClick={e => {
            const newLaps = [...laps];
            newLaps.splice(number - 1, 1);
            setLaps(newLaps);
            localStorage.setItem('laps', JSON.stringify(newLaps));
          }}>x</button></td></tr>;
        })}
      </tbody>
    </table>
  </>;
}

interface Lap {
  time: number;
  note?: string;
}

interface TimeSpan {
  sign: boolean;
  milliseconds: number;
  seconds: number;
  minutes: number;
  hours: number;
}

enum TimeRange {
  Minute,
  Hour,
  Day,
  Month,
  Year
}

function makeTimeSpan(time: number): TimeSpan {
  let sign;

  if (time >= 0) {
    sign = false;
  } else {
    sign = true;
    time *= -1;
  }

  const milliseconds = time % 1000;
  time = Math.trunc(time / 1000);
  const seconds = time % 60;
  time = Math.trunc(time / 60);
  const minutes = time % 60;
  time = Math.trunc(time / 60);
  const hours = time;
  return { sign, milliseconds, seconds, minutes, hours };
}

function timeSpanZero(): TimeSpan {
  return { sign: false, milliseconds: 0, seconds: 0, minutes: 0, hours: 0 };
}

function timeSpanToString(timeSpan: TimeSpan, sign = false) {
  return `${timeSpan.sign ? '-' : sign ? '+' : ''}${timeSpan.hours}:${padZero(timeSpan.minutes, 2)}:${padZero(timeSpan.seconds, 2)}.${padZero(timeSpan.milliseconds, 3)}`;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}/${padZero(date.getMonth() + 1, 2)}/${padZero(date.getDate(), 2)} ${padZero(date.getHours(), 2)}:${padZero(date.getMinutes(), 2)}:${padZero(date.getSeconds(), 2)}.${padZero(date.getMilliseconds(), 3)}`;
}

function padZero(number: number, digits: number) {
  return number.toString().padStart(digits, '0');
}

function daysInMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getDate(), 0).getDate();
}