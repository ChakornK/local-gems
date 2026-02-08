"use client";

import { useGeolocation } from "@/context/GeolocationContext";
import { Stage, Layer, Text, Image as KonvaImage } from "react-konva";
import { useRef, useState, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import useImage from "use-image";

export default function CameraWithEditor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();

  // State to hold the captured image data URL
  const [capturedImage, setCapturedImage] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 360,
    height: 640,
  });
  const [cameraRunning, setCameraRunning] = useState(false);

  // --- CAMERA LOGIC ---
  function givePermission() {
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 4096 },
          height: { ideal: 4096 },
        },
        audio: false,
      })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraRunning(true);
        }
      })
      .catch((err) => console.error(`Error: ${err}`));
  }

  // Auto-request camera permission on mount
  useEffect(() => {
    givePermission();
  }, []);

  function handleCanPlay() {
    if (videoRef.current) {
      // Get the actual video dimensions from the camera
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;

      // Calculate maximum dimensions maintaining 9:16 aspect ratio
      const videoAspectRatio = videoWidth / videoHeight;
      const targetAspectRatio = 9 / 16;
      let width, height;

      if (videoAspectRatio > targetAspectRatio) {
        // Video is wider than 9:16, use full height
        height = videoHeight;
        width = Math.floor(height * targetAspectRatio);
      } else {
        // Video is taller than 9:16, use full width
        width = videoWidth;
        height = Math.floor(width / targetAspectRatio);
      }

      setVideoDimensions({ width, height });
    }
  }

  function capturePicture() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (videoDimensions.width && videoDimensions.height) {
      canvas.width = videoDimensions.width;
      canvas.height = videoDimensions.height;

      // Calculate crop to maintain 9:16 aspect ratio
      const videoAspectRatio = video.videoWidth / video.videoHeight;
      const targetAspectRatio = 9 / 16;
      let sourceX = 0,
        sourceY = 0,
        sourceWidth = video.videoWidth,
        sourceHeight = video.videoHeight;

      if (videoAspectRatio > targetAspectRatio) {
        // Video is wider, crop sides
        sourceWidth = video.videoHeight * targetAspectRatio;
        sourceX = (video.videoWidth - sourceWidth) / 2;
      } else {
        // Video is taller, crop top/bottom
        sourceHeight = video.videoWidth / targetAspectRatio;
        sourceY = (video.videoHeight - sourceHeight) / 2;
      }

      context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight);

      // Save the image to state
      const data = canvas.toDataURL("image/png");
      setCapturedImage(data);

      // Stop the camera stream to save resources
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      setCameraRunning(false);
    }
  }

  // --- RENDERING LOGIC ---
  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-50">
      {!capturedImage ? (
        <div className="relative flex h-full w-full flex-col items-center justify-center bg-slate-950">
          <video
            ref={videoRef}
            onCanPlay={handleCanPlay}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <button
            onClick={() => router.push("/components/")}
            className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center text-2xl font-bold text-white transition hover:opacity-70"
            title="Back"
          >
            ✕
          </button>
          <button
            onClick={givePermission}
            style={{ display: cameraRunning ? "none" : "flex" }}
            className="absolute right-4 top-4 z-10 rounded-lg bg-slate-600 px-4 py-2 font-semibold text-slate-50 transition hover:bg-slate-700"
          >
            Start Camera
          </button>
          <button
            onClick={capturePicture}
            className="absolute bottom-8 left-1/2 z-10 flex h-24 w-24 -translate-x-1/2 transform items-center justify-center rounded-full border-4 border-white bg-white transition hover:bg-slate-100"
            title="Take Photo"
          ></button>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      ) : (
        <KonvaEditor
          imageUrl={capturedImage}
          width={videoDimensions.width}
          height={videoDimensions.height}
          reset={() => setCapturedImage(null)}
        />
      )}
    </div>
  );
}

function KonvaEditor({ imageUrl, width, height, reset }) {
  const stageRef = useRef(null);
  const [textItems, setTextItems] = useState([]);
  const [activeTextId, setActiveTextId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editInputPos, setEditInputPos] = useState({ x: 0, y: 0 });
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [image] = useImage(imageUrl);
  const inputRef = useRef(null);
  const textRefs = useRef({});
  const transformerRefs = useRef({});

  useEffect(() => {
    if (
      selectedTextId &&
      transformerRefs.current[selectedTextId] &&
      textRefs.current[selectedTextId]
    ) {
      const textNode = textRefs.current[selectedTextId];
      const transformer = transformerRefs.current[selectedTextId];
      transformer.nodes([textNode]);
      transformer.getLayer().batchDraw();
    }
  }, [selectedTextId]);

  const { location, loading, error } = useGeolocation();

  const addTextAtPosition = (x, y) => {
    const newId = Date.now().toString();
    setActiveTextId(newId);
    setEditingText("");
    setEditInputPos({ x, y });
    setTextItems([
      ...textItems,
      {
        id: newId,
        text: "",
        x: x,
        y: y,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        fontSize: 48,
        textColor: "white",
        finalized: false,
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCanvasClick = (e) => {
    // Only used for selecting/deselecting, not for adding text
    setSelectedTextId(null);
  };

  const finishEditingText = () => {
    if (activeTextId) {
      setTextItems(
        textItems.map((item) => {
          if (item.id === activeTextId) {
            // Reset fontSize to 24 if empty when finishing
            const fontSize =
              item.fontSize === "" || item.fontSize === 0 ? 24 : item.fontSize;
            return { ...item, text: editingText, fontSize, finalized: true };
          }
          return item;
        }),
      );
      setActiveTextId(null);
      setEditingText("");
    }
  };

  const editExistingText = (id, text, x, y) => {
    setActiveTextId(id);
    setEditingText(text);
    setEditInputPos({ x, y });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const deleteText = (id) => {
    setTextItems(textItems.filter((item) => item.id !== id));
    if (activeTextId === id) {
      setActiveTextId(null);
      setEditingText("");
    }
  };

  const handleTextDragEnd = (id, e) => {
    const newX = e.target.x();
    const newY = e.target.y();
    setTextItems(
      textItems.map((item) =>
        item.id === id ? { ...item, x: newX, y: newY } : item,
      ),
    );
    if (activeTextId === id) {
      setEditInputPos({ x: newX, y: newY });
    }
  };

  const handleTextTransformEnd = (id) => {
    const textNode = textRefs.current[id];
    if (!textNode) return;

    const scaleX = textNode.scaleX();
    const scaleY = textNode.scaleY();
    const rotation = textNode.rotation();
    const x = textNode.x();
    const y = textNode.y();

    setTextItems(
      textItems.map((item) =>
        item.id === id ? { ...item, x, y, scaleX, scaleY, rotation } : item,
      ),
    );
  };

  const handleInputChange = (e) => {
    const newText = e.target.value;
    setEditingText(newText);
    if (activeTextId) {
      setTextItems(
        textItems.map((item) =>
          item.id === activeTextId ? { ...item, text: newText } : item,
        ),
      );
    }
  };

  const handlePost = () => {
    finishEditingText();
    setTimeout(() => {
      const uri = stageRef.current.toDataURL();
      const link = document.createElement("a");
      link.download = "my-edit.png";
      link.href = uri;
      link.click();
    }, 0);
  };

  function uploadImage() {
    finishEditingText();
    if (loading) alert("Please wait for geolocation to load.");
    setTimeout(() => {
      const stage = stageRef.current;
      stage.toBlob().then((blob) => {
        if (!blob) {
          console.error("Failed to convert canvas to blob");
          return;
        }

        const formData = new FormData();
        formData.append("image", blob, "edited-image.png");
        formData.append("lat", location.lat.toString());
        formData.append("lng", location.lng.toString());
        formData.append("description", "");

        fetch("/api/image", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Upload successful:", data);
          })
          .catch((error) => {
            console.error("Upload error:", error);
          });
      });
    }, 0);
  }

  // Calculate scale to fit image to screen width while maintaining aspect ratio
  const [stageWidth, setStageWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 360,
  );
  const [stageHeight, setStageHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 640,
  );

  useEffect(() => {
    const handleResize = () => {
      setStageWidth(window.innerWidth);
      setStageHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scaleToFitWidth = stageWidth / width;
  const scaledHeight = height * scaleToFitWidth;
  const finalScale =
    scaledHeight > stageHeight ? stageHeight / height : scaleToFitWidth;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-50">
      {/* Image Editor - Full screen */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <Stage
          width={stageWidth}
          height={stageHeight}
          ref={stageRef}
          onClick={handleCanvasClick}
          style={{
            display: "block",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <Layer>
            {image && (
              <KonvaImage
                image={image}
                width={width}
                height={height}
                x={(stageWidth - width * finalScale) / 2 / finalScale}
                y={(stageHeight - height * finalScale) / 2 / finalScale}
                scaleX={finalScale}
                scaleY={finalScale}
              />
            )}
            {textItems.map((item) => (
              <Fragment key={item.id}>
                <Text
                  ref={(el) => {
                    if (el) textRefs.current[item.id] = el;
                  }}
                  name={item.id}
                  text={item.text}
                  x={item.x}
                  y={item.y}
                  scaleX={item.scaleX}
                  scaleY={item.scaleY}
                  rotation={item.rotation}
                  draggable
                  fontSize={item.fontSize}
                  fill={item.textColor || "white"}
                  stroke="black"
                  strokeWidth={1}
                  onClick={() => {
                    setSelectedTextId(item.id);
                    editExistingText(item.id, item.text, item.x, item.y);
                  }}
                  onDragEnd={(e) => handleTextDragEnd(item.id, e)}
                  onMouseEnter={(e) => {
                    e.target.to({
                      opacity: 0.8,
                      duration: 0.1,
                    });
                    document.body.style.cursor = "pointer";
                  }}
                  onMouseLeave={(e) => {
                    e.target.to({
                      opacity: 1,
                      duration: 0.1,
                    });
                    document.body.style.cursor = "default";
                  }}
                />
                {selectedTextId === item.id && (
                  <Transformer
                    ref={(el) => {
                      if (el) transformerRefs.current[item.id] = el;
                    }}
                    onTransformEnd={() => handleTextTransformEnd(item.id)}
                    onTransform={() => {
                      const textNode = textRefs.current[item.id];
                      if (textNode) {
                        setTextItems((prevItems) =>
                          prevItems.map((textItem) =>
                            textItem.id === item.id
                              ? {
                                  ...textItem,
                                  x: textNode.x(),
                                  y: textNode.y(),
                                  scaleX: textNode.scaleX(),
                                  scaleY: textNode.scaleY(),
                                  rotation: textNode.rotation(),
                                }
                              : textItem,
                          ),
                        );
                      }
                    }}
                    rotateEnabled={true}
                    resizeEnabled={true}
                    enabledAnchors={[
                      "top-left",
                      "top-center",
                      "top-right",
                      "middle-right",
                      "middle-left",
                      "bottom-left",
                      "bottom-center",
                      "bottom-right",
                    ]}
                    boundBoxFunc={(oldBox, newBox) => newBox}
                  />
                )}
              </Fragment>
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Floating Text Controls - Top */}
      {activeTextId !== null && (
        <div className="absolute left-4 right-4 top-20 z-20 max-h-64 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 bg-opacity-40 backdrop-blur-sm">
          {/* Text Editing Input */}
          {activeTextId !== null && (
            <div className="border-b border-slate-700 px-4 py-3">
              <label className="mb-2 block text-xs font-semibold uppercase text-slate-400">
                Edit Text
              </label>
              <div className="mb-2 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editingText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finishEditingText();
                  }}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-slate-50 focus:border-slate-500 focus:outline-none"
                  placeholder="Enter text..."
                />
                <div className="flex items-center gap-1">
                  <label className="whitespace-nowrap text-xs font-semibold uppercase text-slate-400">
                    Size:
                  </label>
                  <input
                    type="text"
                    value={
                      textItems.find((item) => item.id === activeTextId)
                        ?.fontSize || ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const newSize = parseInt(val);
                      if (val === "" || !isNaN(newSize)) {
                        // Allow any value while typing
                        setTextItems(
                          textItems.map((item) =>
                            item.id === activeTextId
                              ? { ...item, fontSize: val === "" ? "" : newSize }
                              : item,
                          ),
                        );
                      }
                    }}
                    className="w-16 rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-slate-50 focus:border-slate-500 focus:outline-none"
                    placeholder="24"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="whitespace-nowrap text-xs font-semibold uppercase text-slate-400">
                    Color:
                  </label>
                  <input
                    type="color"
                    value={
                      textItems.find((item) => item.id === activeTextId)
                        ?.textColor || "#ffffff"
                    }
                    onChange={(e) => {
                      setTextItems(
                        textItems.map((item) =>
                          item.id === activeTextId
                            ? { ...item, textColor: e.target.value }
                            : item,
                        ),
                      );
                    }}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-1"
                  />
                </div>
              </div>
              <button
                onClick={finishEditingText}
                className="w-full rounded-lg bg-slate-600 py-1 text-sm font-semibold text-slate-50 transition hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          )}
          {textItems.filter((item) => item.finalized).length > 0 && (
            <div className="space-y-1 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Added Text
              </p>
              {textItems
                .filter((item) => item.finalized)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded border border-slate-700 bg-slate-800 p-2 text-sm"
                  >
                    <span
                      className="flex-1 cursor-pointer transition hover:text-slate-300"
                      onClick={() =>
                        editExistingText(item.id, item.text, item.x, item.y)
                      }
                    >
                      {item.text || "(empty)"}
                    </span>
                    <button
                      onClick={() => deleteText(item.id)}
                      className="ml-2 text-xs font-semibold text-slate-400 transition hover:text-slate-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Overlay Buttons */}
      <div className="absolute left-4 top-4 z-20">
        <button
          onClick={reset}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600 text-slate-50 opacity-70 transition hover:bg-slate-700 hover:opacity-100"
          title="Back"
        >
          ✕
        </button>
      </div>

      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <button
          onClick={() => addTextAtPosition(width / 2 - 50, height / 2)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-600 text-xl font-bold text-slate-50 opacity-70 transition hover:bg-slate-700 hover:opacity-100"
          title="Add Text"
        >
          +
        </button>
        <button
          onClick={uploadImage}
          className="flex items-center justify-center gap-2 rounded-full bg-slate-600 px-4 py-2 text-slate-50 opacity-70 transition hover:bg-slate-700 hover:opacity-100"
          title="Post"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Post
        </button>
      </div>
    </div>
  );
}
