"use client";

import { useRef, useState } from "react";
import { Stage, Layer, Text, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";

export default function CameraWithEditor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // State to hold the captured image data URL
  const [capturedImage, setCapturedImage] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 600, height: 0 });

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
      const aspectRatio = videoRef.current.videoHeight / videoRef.current.videoWidth;
      setVideoDimensions({ ...videoDimensions, height: videoDimensions.width * aspectRatio });
    }
  }

  function capturePicture() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (videoDimensions.width && videoDimensions.height) {
      canvas.width = videoDimensions.width;
      canvas.height = videoDimensions.height;
      context.drawImage(video, 0, 0, videoDimensions.width, videoDimensions.height);

      // Save the image to state
      const data = canvas.toDataURL("image/png");
      setCapturedImage(data);
      
      // Stop the camera stream to save resources
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  }

  // --- RENDERING LOGIC ---
  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
      {!capturedImage ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4 bg-black">
          <video 
            ref={videoRef} 
            onCanPlay={handleCanPlay}
            className="rounded-lg mb-4"
            style={{ width: videoDimensions.width, maxHeight: "60vh" }}
          />
          <div className="flex gap-3">
            <button 
              onClick={givePermission} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Start Camera
            </button>
            <button 
              onClick={capturePicture} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Take Photo
            </button>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
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

  const addTextAtPosition = (x, y) => {
    const newId = Date.now().toString();
    setActiveTextId(newId);
    setEditingText("");
    setEditInputPos({ x, y });
    setTextItems([...textItems, {
      id: newId,
      text: "",
      x: x,
      y: y,
      finalized: false,
    }]);
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
      setTextItems(textItems.map(item => 
        item.id === activeTextId ? { ...item, text: editingText, finalized: true } : item
      ));
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
    setTextItems(textItems.filter(item => item.id !== id));
    if (activeTextId === id) {
      setActiveTextId(null);
      setEditingText("");
    }
  };

  const handleTextDragEnd = (id, e) => {
    const newX = e.target.x();
    const newY = e.target.y();
    setTextItems(textItems.map(item =>
      item.id === id ? { ...item, x: newX, y: newY } : item
    ));
    if (activeTextId === id) {
      setEditInputPos({ x: newX, y: newY });
    }
  };

  const handleInputChange = (e) => {
    const newText = e.target.value;
    setEditingText(newText);
    if (activeTextId) {
      setTextItems(textItems.map(item =>
        item.id === activeTextId ? { ...item, text: newText } : item
      ));
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
    setTimeout(() => {
      const stage = stageRef.current;
      stage.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to convert canvas to blob');
          return;
        }

        const formData = new FormData();
        formData.append('image', blob, 'edited-image.png');

        fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          console.log('Upload successful:', data);
        })
        .catch(error => {
          console.error('Upload error:', error);
        });
      });
    }, 0);
  }


  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700">
        <button 
          onClick={reset} 
          className="text-white text-lg font-semibold hover:opacity-70 transition"
        >
          Back        </button>
        <h1 className="text-xl font-bold">Create Post</h1>
        <button 
          onClick={uploadImage} 
          className="text-blue-400 text-lg font-bold hover:opacity-70 transition"
        >
          Post
        </button>
      </div>

      {/* Image Editor - Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full flex flex-col items-center p-4">
          {/* Image Editor Container */}
          <div className="w-full max-w-md relative mb-4" ref={stageContainerRef}>
            <Stage width={width} height={height} ref={stageRef} onClick={handleCanvasClick} className="border border-gray-700 rounded-lg overflow-hidden">
              <Layer>
                {image && <KonvaImage image={image} width={width} height={height} />}
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
                      onClick={() => editExistingText(item.id, item.text, item.x, item.y)}
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
            <div className="w-full px-4 mt-4 mb-4">
              <label className="text-xs text-gray-400 uppercase font-semibold block mb-2">Edit Text</label>
              <input
                ref={inputRef}
                type="text"
                value={editingText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEditingText();
                }}
                onBlur={finishEditingText}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-3 focus:border-blue-500 focus:outline-none"
                placeholder="Enter text..."
              />
              <button
                onClick={finishEditingText}
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
              >
                Done
              </button>
            </div>
          )}
          {textItems.filter(item => item.finalized).length > 0 && (
            <div className="w-full max-w-md space-y-2 mb-4">
              <p className="text-xs text-gray-400 uppercase">Added Text</p>
              {textItems.filter(item => item.finalized).map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <span 
                    className="text-sm flex-1 cursor-pointer hover:text-blue-400 transition" 
                    onClick={() => editExistingText(item.id, item.text, item.x, item.y)}
                  >
                    {item.text || "(empty)"}
                  </span>
                  <button
                    onClick={() => deleteText(item.id)}
                    className="text-gray-400 hover:text-red-400 transition ml-2 text-sm font-semibold"
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
      <div className="border-t border-gray-700 p-4 flex justify-around items-center bg-black">
        <button className="text-gray-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
        <button 
          onClick={handlePost}
          className="w-16 h-16 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition transform hover:scale-105"
        >
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <button className="text-gray-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}