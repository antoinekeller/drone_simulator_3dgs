import { useState, useRef, useEffect } from "react";

// 🛠 Create a React component for the Motor Sound
const MotorSound = ({ speed }: { speed: number }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    audioCtxRef.current = new AudioContext();

    fetch("src/assets/quadcopter.mp3")
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => audioCtxRef.current!.decodeAudioData(arrayBuffer))
      .then((audioBuffer) => {
        bufferRef.current = audioBuffer;
      })
      .catch((error) => console.error("Error loading sound:", error));
  }, []);

  const startEngine = () => {
    if (!audioCtxRef.current || !bufferRef.current) return;

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = bufferRef.current;
    source.loop = true;
    source.connect(audioCtxRef.current.destination);
    source.start();

    sourceRef.current = source;
    setIsPlaying(true);
  };

  const stopEngine = () => {
    sourceRef.current?.stop();
    setIsPlaying(false);
  };

  useEffect(() => {
    if (sourceRef.current) {
      sourceRef.current.playbackRate.setValueAtTime(
        speed,
        audioCtxRef.current!.currentTime
      );
    }
  }, [speed]);

  return (
    <div id="motor-sound-ui">
      {isPlaying ? (
        <button onClick={stopEngine}>🔊</button> // Stop engine when clicked
      ) : (
        <button onClick={startEngine}>🔇</button> // Start engine when clicked
      )}
    </div>
  );
};

export default MotorSound;
