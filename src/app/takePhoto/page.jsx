"use client";

import { useGeolocation } from "@/context/GeolocationContext";
import { useRef, useState } from "react";
import { Stage, Layer, Text, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";

export default function CameraWithEditor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // State to hold the captured image data URL
  const [capturedImage, setCapturedImage] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 600,
    height: 0,
  });

  // --- CAMERA LOGIC ---
  function givePermission() {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((err) => console.error(`Error: ${err}`));
  }

  function handleCanPlay() {
    if (videoRef.current) {
      const aspectRatio =
        videoRef.current.videoHeight / videoRef.current.videoWidth;
      setVideoDimensions({
        ...videoDimensions,
        height: videoDimensions.width * aspectRatio,
      });
    }
  }

  function capturePicture() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (videoDimensions.width && videoDimensions.height) {
      canvas.width = videoDimensions.width;
      canvas.height = videoDimensions.height;
      context.drawImage(
        video,
        0,
        0,
        videoDimensions.width,
        videoDimensions.height,
      );

      // Save the image to state
      const data = canvas.toDataURL("image/png");
      setCapturedImage(data);

      // Stop the camera stream to save resources
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  }

  // --- RENDERING LOGIC ---
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black text-white">
      {!capturedImage ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-black p-4">
          <video
            ref={videoRef}
            onCanPlay={handleCanPlay}
            className="mb-4 rounded-lg"
            style={{ width: videoDimensions.width, maxHeight: "60vh" }}
          />
          <div className="flex gap-3">
            <button
              onClick={givePermission}
              className="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white transition hover:bg-blue-600"
            >
              Start Camera
            </button>
            <button
              onClick={capturePicture}
              className="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white transition hover:bg-blue-600"
            >
              Take Photo
            </button>
          </div>
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
  const [image] = useImage(imageUrl);
  const stageContainerRef = useRef(null);
  const inputRef = useRef(null);

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
        finalized: false,
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCanvasClick = (e) => {
    if (activeTextId === null) {
      const stage = stageRef.current;
      const pointerPos = stage.getPointerPosition();
      addTextAtPosition(pointerPos.x, pointerPos.y);
    }
  };

  const finishEditingText = () => {
    if (activeTextId) {
      setTextItems(
        textItems.map((item) =>
          item.id === activeTextId
            ? { ...item, text: editingText, finalized: true }
            : item,
        ),
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

  return (
    <div className="flex h-screen w-screen flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
        <button
          onClick={reset}
          className="text-lg font-semibold text-white transition hover:opacity-70"
        >
          Back{" "}
        </button>
        <h1 className="text-xl font-bold">Create Post</h1>
        <button
          onClick={uploadImage}
          className="text-lg font-bold text-blue-400 transition hover:opacity-70"
        >
          Post
        </button>
      </div>

      {/* Image Editor - Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex w-full flex-col items-center p-4">
          {/* Image Editor Container */}
          <div
            className="relative mb-4 w-full max-w-md"
            ref={stageContainerRef}
          >
            <Stage
              width={width}
              height={height}
              ref={stageRef}
              onClick={handleCanvasClick}
              className="overflow-hidden rounded-lg border border-gray-700"
            >
              <Layer>
                {image && (
                  <KonvaImage image={image} width={width} height={height} />
                )}
                {textItems.map((item) => (
                  <div key={item.id}>
                    <Text
                      text={item.text}
                      x={item.x}
                      y={item.y}
                      draggable
                      fontSize={24}
                      fill="white"
                      stroke="black"
                      strokeWidth={1}
                      onClick={() =>
                        editExistingText(item.id, item.text, item.x, item.y)
                      }
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
                    {activeTextId === item.id && (
                      <Rect
                        x={item.x - 5}
                        y={item.y - 5}
                        width={Math.max(item.text.length * 12 + 10, 50)}
                        height={34}
                        stroke="cyan"
                        strokeWidth={2}
                        fill="transparent"
                      />
                    )}
                  </div>
                ))}
              </Layer>
            </Stage>

            {/* Text input box removed from here - will be below the image */}
          </div>

          {/* Text Editing Input - Below the image */}
          {activeTextId !== null && (
            <div className="mb-4 mt-4 w-full px-4">
              <label className="mb-2 block text-xs font-semibold uppercase text-gray-400">
                Edit Text
              </label>
              <input
                ref={inputRef}
                type="text"
                value={editingText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEditingText();
                }}
                onBlur={finishEditingText}
                className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Enter text..."
              />
              <button
                onClick={finishEditingText}
                className="mt-2 w-full rounded-lg bg-blue-500 py-2 font-semibold text-white transition hover:bg-blue-600"
              >
                Done
              </button>
            </div>
          )}
          {textItems.filter((item) => item.finalized).length > 0 && (
            <div className="mb-4 w-full max-w-md space-y-2">
              <p className="text-xs uppercase text-gray-400">Added Text</p>
              {textItems
                .filter((item) => item.finalized)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900 p-3"
                  >
                    <span
                      className="flex-1 cursor-pointer text-sm transition hover:text-blue-400"
                      onClick={() =>
                        editExistingText(item.id, item.text, item.x, item.y)
                      }
                    >
                      {item.text || "(empty)"}
                    </span>
                    <button
                      onClick={() => deleteText(item.id)}
                      className="ml-2 text-sm font-semibold text-gray-400 transition hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer with action buttons */}
      <div className="flex items-center justify-around border-t border-gray-700 bg-black p-4">
        <button className="text-gray-400 transition hover:text-white">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
        <button
          onClick={handlePost}
          className="flex h-16 w-16 transform items-center justify-center rounded-full bg-blue-500 transition hover:scale-105 hover:bg-blue-600"
        >
          <svg
            className="h-8 w-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <button className="text-gray-400 transition hover:text-white">
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
