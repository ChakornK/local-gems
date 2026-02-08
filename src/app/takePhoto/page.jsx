"use client";

import { useGeolocation } from "@/context/GeolocationContext";
import {
  Stage,
  Layer,
  Text,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import { useRef, useState, useEffect, Fragment, useCallback } from "react";
import { useRouter } from "next/navigation";
import useImage from "use-image";

export default function CameraWithEditor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();

  const [capturedImage, setCapturedImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 360, height: 640 });
  const [cameraRunning, setCameraRunning] = useState(false);

  // --- CAMERA LOGIC ---
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraRunning(true);
      }
    } catch (err) {
      console.error(`Camera Error: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    if (!capturedImage && !editedImage) startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [capturedImage, editedImage, startCamera]);

  function handleCanPlay() {
    if (videoRef.current) {
      const vWidth = videoRef.current.videoWidth;
      const vHeight = videoRef.current.videoHeight;
      const targetRatio = 9 / 16;
      let width, height;

      if (vWidth / vHeight > targetRatio) {
        height = vHeight;
        width = Math.floor(height * targetRatio);
      } else {
        width = vWidth;
        height = Math.floor(width / targetRatio);
      }
      setVideoDimensions({ width, height });
      videoRef.current.play().catch(console.error);
    }
  }

  function capturePicture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext("2d");
    const targetRatio = 9 / 16;
    let sWidth = video.videoWidth;
    let sHeight = video.videoHeight;
    let sX = 0, sY = 0;

    if (sWidth / sHeight > targetRatio) {
      sWidth = sHeight * targetRatio;
      sX = (video.videoWidth - sWidth) / 2;
    } else {
      sHeight = sWidth / targetRatio;
      sY = (video.videoHeight - sHeight) / 2;
    }

    canvas.width = videoDimensions.width;
    canvas.height = videoDimensions.height;
    context.drawImage(video, sX, sY, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

    setCapturedImage(canvas.toDataURL("image/png"));
    setCameraRunning(false);
  }

  return (
    <div className="relative h-screen w-screen bg-slate-950 overflow-hidden text-slate-50">
      {/* 1. Camera View */}
      {!capturedImage && !editedImage && (
        <div className="relative h-full w-full bg-black">
          <video ref={videoRef} onCanPlay={handleCanPlay} playsInline autoPlay muted className="absolute inset-0 h-full w-full object-cover" />
          <button onClick={() => router.push("/components/")} className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white">✕</button>
          <button onClick={capturePicture} className="absolute bottom-12 left-1/2 z-10 h-20 w-20 -translate-x-1/2 rounded-full border-4 border-white bg-white/20 active:scale-95 transition" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* 2. Konva Editor View */}
      {capturedImage && !editedImage && (
        <KonvaEditor
          imageUrl={capturedImage}
          width={videoDimensions.width}
          height={videoDimensions.height}
          onBack={() => setCapturedImage(null)}
          onNext={(data) => setEditedImage(data)}
        />
      )}

      {/* 3. Info Editor View */}
      {editedImage && (
        <InfoEditor imageUrl={editedImage} onBack={() => setEditedImage(null)} />
      )}
    </div>
  );
}

// --- EDITOR COMPONENT (Integrated with your Text logic) ---
function KonvaEditor({ imageUrl, width, height, onBack, onNext }) {
  const stageRef = useRef(null);
  const inputRef = useRef(null);
  const textRefs = useRef({});
  const transformerRefs = useRef({});
  
  const [image] = useImage(imageUrl);
  const [textItems, setTextItems] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [selectedTextId, setSelectedTextId] = useState(null);

  // Responsive stage sizing
  const [winSize, setWinSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const handleResize = () => setWinSize({ w: window.innerWidth, h: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scaleToFitWidth = winSize.w / width;
  const scaledHeight = height * scaleToFitWidth;
  const finalScale = scaledHeight > winSize.h ? winSize.h / height : scaleToFitWidth;

  // Transformer logic
  useEffect(() => {
    if (selectedTextId && transformerRefs.current[selectedTextId] && textRefs.current[selectedTextId]) {
      const node = textRefs.current[selectedTextId];
      const transformer = transformerRefs.current[selectedTextId];
      transformer.nodes([node]);
      transformer.getLayer().batchDraw();
    }
  }, [selectedTextId]);

  const addTextAtPosition = (x, y) => {
    const newId = Date.now().toString();
    setActiveTextId(newId);
    setEditingText("");
    setTextItems([...textItems, {
      id: newId, text: "", x, y, scaleX: 1, scaleY: 1, rotation: 0, fontSize: 48, textColor: "white", finalized: false,
    }]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const finishEditingText = () => {
    if (activeTextId) {
      setTextItems(textItems.map((item) => {
        if (item.id === activeTextId) {
          return { ...item, text: editingText, fontSize: item.fontSize || 24, finalized: true };
        }
        return item;
      }));
      setActiveTextId(null);
      setEditingText("");
    }
  };

  const editExistingText = (id, text, x, y) => {
    setActiveTextId(id);
    setEditingText(text);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center bg-black overflow-hidden">
      <Stage
        width={winSize.w}
        height={winSize.h}
        ref={stageRef}
        onClick={() => setSelectedTextId(null)}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              width={width}
              height={height}
              x={(winSize.w - width * finalScale) / 2 / finalScale}
              y={(winSize.h - height * finalScale) / 2 / finalScale}
              scaleX={finalScale}
              scaleY={finalScale}
            />
          )}
          {textItems.map((item) => (
            <Fragment key={item.id}>
              <Text
                ref={(el) => { if (el) textRefs.current[item.id] = el; }}
                name={item.id}
                text={item.text}
                x={item.x} y={item.y}
                scaleX={item.scaleX} scaleY={item.scaleY}
                rotation={item.rotation}
                draggable
                fontSize={item.fontSize}
                fill={item.textColor || "white"}
                stroke="black" strokeWidth={1}
                onClick={(e) => {
                  e.cancelBubble = true;
                  setSelectedTextId(item.id);
                  editExistingText(item.id, item.text, item.x, item.y);
                }}
                onDragEnd={(e) => {
                  setTextItems(textItems.map(t => t.id === item.id ? { ...t, x: e.target.x(), y: e.target.y() } : t));
                }}
              />
              {selectedTextId === item.id && (
                <Transformer
                  ref={(el) => { if (el) transformerRefs.current[item.id] = el; }}
                  onTransformEnd={() => {
                    const node = textRefs.current[item.id];
                    setTextItems(textItems.map(t => t.id === item.id ? {
                      ...t, x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation()
                    } : t));
                  }}
                />
              )}
            </Fragment>
          ))}
        </Layer>
      </Stage>

      {/* UI Overlay */}
      <div className="absolute left-4 top-4 z-20"><button onClick={onBack} className="h-10 w-10 rounded-full bg-black/50 text-white">✕</button></div>
      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <button onClick={() => addTextAtPosition(winSize.w/2 - 50, winSize.h/2)} className="h-10 w-10 rounded-full bg-black/50 text-xl font-bold">+</button>
        <button onClick={() => { setSelectedTextId(null); finishEditingText(); setTimeout(() => onNext(stageRef.current.toDataURL()), 100); }} className="px-6 rounded-full bg-blue-600 font-bold">Next</button>
      </div>

      {/* Text Editing Panel */}
      {activeTextId !== null && (
        <div className="absolute left-4 right-4 top-20 z-30 rounded-2xl border border-slate-700 bg-slate-900/80 p-4 backdrop-blur-md">
          <label className="mb-2 block text-xs font-bold text-slate-400 uppercase">Edit Text</label>
          <div className="flex flex-col gap-3">
            <input ref={inputRef} value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full rounded-lg bg-slate-800 p-2 outline-none border border-slate-700" placeholder="Type here..." />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs">Size</span>
                <input type="number" value={textItems.find(i => i.id === activeTextId)?.fontSize || 48} onChange={(e) => setTextItems(textItems.map(t => t.id === activeTextId ? { ...t, fontSize: parseInt(e.target.value) || 0 } : t))} className="w-16 rounded bg-slate-800 p-1" />
              </div>
              <input type="color" value={textItems.find(i => i.id === activeTextId)?.textColor || "#ffffff"} onChange={(e) => setTextItems(textItems.map(t => t.id === activeTextId ? { ...t, textColor: e.target.value } : t))} className="h-8 w-8 rounded bg-transparent" />
              <button onClick={finishEditingText} className="rounded bg-blue-600 px-4 py-1 text-sm font-bold">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- INFO EDITOR ---
function InfoEditor({ imageUrl, onBack }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { location, loading } = useGeolocation();
  const router = useRouter();

  const handlePublish = async () => {
    if (loading) return alert("Waiting for location...");
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const formData = new FormData();
      formData.append("image", blob, "post.png");
      formData.append("lat", location?.lat?.toString() || "0");
      formData.append("lng", location?.lng?.toString() || "0");
      formData.append("title", title);
      formData.append("description", description);
      await fetch("/api/image", { method: "POST", body: formData });
      router.push("/components/");
    } catch (e) { alert("Error uploading"); }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950">
      <div className="z-20 flex items-center justify-between p-4 bg-slate-950/80">
        <button onClick={onBack} className="text-2xl p-2">✕</button>
        <button onClick={handlePublish} className="rounded-full bg-blue-600 px-6 py-2 font-bold">Publish</button>
      </div>

      <div className="h-1/6 w-full flex justify-center bg-black overflow-hidden">
        <img src={imageUrl} alt="Preview" className="h-full object-contain aspect-[9/16]" />
      </div>

      <div className="flex flex-1 flex-col gap-6 bg-slate-900 p-6 rounded-t-3xl mt-4 border-t border-slate-800">
        <div>
          <label className="mb-2 block text-xs font-bold text-slate-500 uppercase">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give it a title..." className="w-full rounded-xl bg-slate-800 p-4 outline-none border border-slate-700 focus:border-blue-500" />
        </div>
        <div className="flex-1 flex flex-col">
          <label className="mb-2 block text-xs font-bold text-slate-500 uppercase">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your post..." className="w-full flex-1 rounded-xl bg-slate-800 p-4 resize-none outline-none border border-slate-700 focus:border-blue-500" />
        </div>
      </div>
    </div>
  );
}