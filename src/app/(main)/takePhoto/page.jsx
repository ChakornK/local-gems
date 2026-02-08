"use client";

import { useGeolocation } from "@/context/GeolocationContext";
import { Stage, Layer, Text, Image as KonvaImage, Transformer, Group, Label, Tag } from "react-konva";
import { useRef, useState, useEffect, Fragment, useCallback } from "react";
import { useRouter } from "next/navigation";
import useImage from "use-image";

export default function CameraWithEditor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();
  const [videoStream, setVideoStream] = useState(null);

  const [capturedImage, setCapturedImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 360,
    height: 640,
  });

  // --- CAMERA LOGIC ---
  const stopStreams = () => {
    try {
      if (!videoStream) return;
      videoStream.getTracks().forEach((t) => t.stop());
    } catch {}
  };
  const startCamera = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter((d) => d.kind === "videoinput");
      const backCamId = cams.find((c) => c.label.includes("back:0"))?.deviceId;
      const stream = await navigator.mediaDevices.getUserMedia(
        backCamId
          ? {
              video: {
                deviceId: {
                  exact: backCamId,
                },
              },
            }
          : {
              video: {
                facingMode: "environment",
              },
            },
      );
      stopStreams();
      setVideoStream(stream);
    } catch (err) {
      console.error(`Camera Error: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    if (!capturedImage && !editedImage) {
      startCamera();
    } else {
      stopStreams();
    }
    return () => {
      stopStreams();
    };
  }, [capturedImage, editedImage, startCamera]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoRef.current]);

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
    let sX = 0,
      sY = 0;

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
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* 1. Camera View */}
      {!capturedImage && !editedImage && (
        <div className="flex h-full w-full flex-col items-center bg-black">
          <div className="aspect-9/16 relative grow overflow-clip rounded-xl">
            <video
              ref={videoRef}
              onCanPlay={handleCanPlay}
              playsInline
              autoPlay
              muted
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="min-h-32 flex shrink-0 items-center justify-center bg-black">
            <button
              onClick={capturePicture}
              className="group h-20 w-20 rounded-full border-4 border-white transition active:scale-95"
            >
              <div className="h-full w-full scale-105 rounded-full bg-white transition group-active:scale-75 group-active:bg-white/50"></div>
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <button
            onClick={() => router.push("/")}
            className="absolute left-4 top-8 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white"
          >
            ✕
          </button>
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
      {editedImage && <InfoEditor imageUrl={editedImage} onBack={() => setEditedImage(null)} />}
    </div>
  );
}

// --- EDITOR COMPONENT ---
function KonvaEditor({ imageUrl, width, height, onBack, onNext }) {
  const stageRef = useRef(null);
  const textRefs = useRef({});
  const transformerRefs = useRef({});

  const [image] = useImage(imageUrl);
  const [textItems, setTextItems] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [currentText, setCurrentText] = useState("");
  const [currentStyle, setCurrentStyle] = useState("bg-black"); // plain-white, plain-black, bg-black, bg-white

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

  const startAddingText = () => {
    const newId = Date.now().toString();
    const centerX = width / 2;
    const centerY = height / 2;

    const newItem = {
      id: newId,
      text: "",
      x: centerX,
      y: centerY,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      fontSize: 48,
      styleType: "bg-black", // Default style
    };

    setTextItems([...textItems, newItem]);
    setEditingItemId(newId);
    setCurrentText("");
    setCurrentStyle("bg-black");
    setIsEditing(true);
    setSelectedTextId(null);
  };

  const startEditingText = (item) => {
    setEditingItemId(item.id);
    setCurrentText(item.text);
    setCurrentStyle(item.styleType || "bg-black");
    setIsEditing(true);
    setSelectedTextId(null);
  };

  const saveText = () => {
    if (editingItemId) {
      if (currentText.trim() === "") {
        // Remove empty text items
        setTextItems(textItems.filter((i) => i.id !== editingItemId));
      } else {
        setTextItems(
          textItems.map((item) =>
            item.id === editingItemId ? { ...item, text: currentText, styleType: currentStyle } : item,
          ),
        );
      }
    }
    setIsEditing(false);
    setEditingItemId(null);
  };

  const handleNext = () => {
    setSelectedTextId(null);
    setTimeout(() => {
      const stage = stageRef.current;
      const area = {
        x: (winSize.w - width * finalScale) / 2,
        y: (winSize.h - height * finalScale) / 2,
        width: width * finalScale,
        height: height * finalScale,
      };
      onNext(stage.toDataURL(area));
    }, 100);
  };

  // Helper to render text based on style
  const renderTextItem = (item) => {
    const isBeingEdited = editingItemId === item.id;

    const textToRender = isBeingEdited ? currentText : item.text;
    const styleToRender = isBeingEdited ? currentStyle : item.styleType;

    if (!textToRender && !isBeingEdited) return null; // Don't render empty finished items

    const commonProps = {
      x: item.x,
      y: item.y,
      rotation: item.rotation,
      scaleX: item.scaleX,
      scaleY: item.scaleY,
      draggable: !isEditing,
      onClick: (e) => {
        if (isEditing) return;
        e.cancelBubble = true;
        if (selectedTextId === item.id) {
          startEditingText(item);
        } else {
          setSelectedTextId(item.id);
        }
      },
      onTap: (e) => {
        if (isEditing) return;
        e.cancelBubble = true;
        if (selectedTextId === item.id) {
          startEditingText(item);
        } else {
          setSelectedTextId(item.id);
        }
      },
      onDragEnd: (e) => {
        setTextItems(textItems.map((t) => (t.id === item.id ? { ...t, x: e.target.x(), y: e.target.y() } : t)));
      },
    };

    // Style configs
    let fill = "white";
    let stroke = null;
    let background = null;

    switch (styleToRender) {
      case "plain-black":
        fill = "black";
        break;
      case "bg-black":
        fill = "white";
        background = "black";
        break;
      case "bg-white":
        fill = "black";
        background = "white";
        break;
      case "plain-white":
      default:
        fill = "white";
        break;
    }

    if (background) {
      return (
        <Group
          key={item.id}
          {...commonProps}
          ref={(el) => {
            if (el) textRefs.current[item.id] = el;
          }}
        >
          <Label>
            <Tag
              fill={background}
              cornerRadius={10}
              pointerDirection="none"
              pointerWidth={10}
              pointerHeight={10}
              lineJoin="round"
            />
            <Text text={textToRender} fontSize={item.fontSize} padding={10} fill={fill} align="center" />
          </Label>
        </Group>
      );
    }

    return (
      <Text
        key={item.id}
        ref={(el) => {
          if (el) textRefs.current[item.id] = el;
        }}
        {...commonProps}
        text={textToRender}
        fontSize={item.fontSize}
        fill={fill}
        padding={10}
      />
    );
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-black">
      <Stage
        width={winSize.w}
        height={winSize.h}
        ref={stageRef}
        onClick={() => {
          if (isEditing) {
            saveText();
          } else {
            setSelectedTextId(null);
          }
        }}
        onTap={() => {
          if (isEditing) {
            saveText();
          } else {
            setSelectedTextId(null);
          }
        }}
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
              {renderTextItem(item)}
              {selectedTextId === item.id && !isEditing && (
                <Transformer
                  ref={(el) => {
                    if (el) transformerRefs.current[item.id] = el;
                  }}
                  onTransformEnd={() => {
                    const node = textRefs.current[item.id];
                    setTextItems(
                      textItems.map((t) =>
                        t.id === item.id
                          ? {
                              ...t,
                              x: node.x(),
                              y: node.y(),
                              scaleX: node.scaleX(),
                              scaleY: node.scaleY(),
                              rotation: node.rotation(),
                            }
                          : t,
                      ),
                    );
                  }}
                />
              )}
            </Fragment>
          ))}
        </Layer>
      </Stage>

      {/* Top Controls */}
      {!isEditing && (
        <>
          <div className="absolute left-4 top-8 z-20">
            <button onClick={onBack} className="h-10 w-10 rounded-full bg-black/50 text-white">
              ✕
            </button>
          </div>
          <div className="absolute right-4 top-8 z-20">
            <button onClick={handleNext} className="rounded-full bg-blue-600 px-6 py-2 font-bold text-white shadow-lg">
              Next
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-28 left-0 right-0 z-20 flex justify-center">
            <button
              onClick={startAddingText}
              className="flex items-center gap-2 rounded-full bg-black/60 px-6 py-3 font-semibold text-white backdrop-blur-md transition-transform active:scale-95"
            >
              <span className="text-xl">+</span> Add caption
            </button>
          </div>
        </>
      )}

      {/* Caption Input Form */}
      {isEditing && (
        <CaptionInput
          text={currentText}
          setText={setCurrentText}
          styleType={currentStyle}
          setStyleType={setCurrentStyle}
          onDone={saveText}
        />
      )}
    </div>
  );
}

function CaptionInput({ text, setText, styleType, setStyleType, onDone }) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const styles = [
    { id: "plain-white", bg: "bg-black", text: "text-white", label: "Aa" }, // UI preview colors
    { id: "plain-black", bg: "bg-white", text: "text-black", label: "Aa" },
    { id: "bg-black", bg: "bg-black", text: "text-white", border: "border-white", label: "Aa" },
    { id: "bg-white", bg: "bg-white", text: "text-black", border: "border-gray-200", label: "Aa" },
  ];

  // Map internal style IDs to UI classes for the selector buttons
  const getStyleClasses = (id) => {
    switch (id) {
      case "plain-white":
        return "bg-gray-800 text-white";
      case "plain-black":
        return "bg-gray-200 text-black";
      case "bg-black":
        return "bg-black text-white border border-gray-600";
      case "bg-white":
        return "bg-white text-black border border-gray-300";
      default:
        return "bg-gray-800 text-white";
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col gap-4 rounded-t-2xl border-t border-slate-800 bg-slate-900 p-4 pb-8 shadow-2xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-slate-500">Caption</span>
        <button onClick={onDone} className="rounded-full bg-blue-600 px-4 py-1 text-sm font-bold text-white">
          Done
        </button>
      </div>

      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your caption..."
        className="w-full bg-transparent text-xl text-white outline-none placeholder:text-slate-600"
      />

      <div className="flex gap-4 overflow-x-auto pb-2 pt-2">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyleType(s.id)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-transform
                            ${getStyleClasses(s.id)}
                            ${styleType === s.id ? "scale-110 ring-2 ring-blue-500" : ""}
                        `}
          >
            Aa
          </button>
        ))}
      </div>
    </div>
  );
}

// --- INFO EDITOR ---
function InfoEditor({ imageUrl, onBack }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const { location, loading } = useGeolocation();
  const router = useRouter();

  const handlePublish = async () => {
    if (loading) return alert("Waiting for location...");
    if (isPublishing) return;

    try {
      setIsPublishing(true);
      const blob = await (await fetch(imageUrl)).blob();
      const formData = new FormData();
      formData.append("image", blob, "post.png");
      formData.append("lat", location?.lat?.toString() || "0");
      formData.append("lng", location?.lng?.toString() || "0");
      formData.append("title", title);
      formData.append("description", description);
      const res = await fetch("/api/image", { method: "POST", body: formData });
      const data = await res.json();
      if (data._id) {
        router.push(`/?gemId=${data._id}`, { scroll: false });
      } else {
        router.push("/", { scroll: false });
      }
    } catch (e) {
      alert("Error uploading");
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950">
      <div className="z-20 flex items-center justify-between bg-slate-950/80 p-4">
        <button onClick={onBack} className="p-2 text-2xl" disabled={isPublishing}>
          ✕
        </button>
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className={`rounded-full px-6 py-2 font-bold transition-all ${
            isPublishing ? "cursor-not-allowed bg-slate-700 text-slate-400" : "bg-blue-600 text-white active:scale-95"
          }`}
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
      </div>

      <div className="flex h-1/6 w-full justify-center overflow-hidden bg-black">
        <img src={imageUrl} alt="Preview" className="aspect-9/16 h-full object-contain" />
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-6 rounded-t-3xl border-t border-slate-800 bg-slate-900 p-6">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give it a title..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4 outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-1 flex-col">
          <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your post..."
            className="w-full flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800 p-4 outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
