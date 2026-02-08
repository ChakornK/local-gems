"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Stage, Layer, Text, Image as KonvaImage, Rect, Transformer } from "react-konva";
import useImage from "use-image";

export default function CameraWithEditor() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();
  
  // State to hold the captured image data URL
  const [capturedImage, setCapturedImage] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 360, height: 640 });
  const [cameraRunning, setCameraRunning] = useState(false);

  // --- CAMERA LOGIC ---
  function givePermission() {
    navigator.mediaDevices
      .getUserMedia({ 
        video: { 
          width: { ideal: 4096 },
          height: { ideal: 4096 }
        }, 
        audio: false 
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
      let sourceX = 0, sourceY = 0, sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
      
      if (videoAspectRatio > targetAspectRatio) {
        // Video is wider, crop sides
        sourceWidth = video.videoHeight * targetAspectRatio;
        sourceX = (video.videoWidth - sourceWidth) / 2;
      } else {
        // Video is taller, crop top/bottom
        sourceHeight = video.videoWidth / targetAspectRatio;
        sourceY = (video.videoHeight - sourceHeight) / 2;
      }
      
      context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, videoDimensions.width, videoDimensions.height);

      // Save the image to state
      const data = canvas.toDataURL("image/png");
      setCapturedImage(data);
      
      // Stop the camera stream to save resources
      const stream = video.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setCameraRunning(false);
    }
  }

  // --- RENDERING LOGIC ---
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden relative">
      {!capturedImage ? (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-950 relative">
          <video 
            ref={videoRef} 
            onCanPlay={handleCanPlay}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <button
            onClick={() => router.push('/components/')}
            className="absolute top-4 left-4 text-white text-2xl font-bold hover:opacity-70 transition z-10 w-10 h-10 flex items-center justify-center"
            title="Back"
          >
            ✕
          </button>
          <button 
            onClick={givePermission}
            style={{ display: cameraRunning ? 'none' : 'flex' }}
            className="absolute top-4 right-4 bg-slate-600 hover:bg-slate-700 text-slate-50 px-4 py-2 rounded-lg font-semibold transition z-10"
          >
            Start Camera
          </button>
          <button 
            onClick={capturePicture} 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full bg-white border-4 border-white hover:bg-slate-100 transition flex items-center justify-center z-10"
            title="Take Photo"
          >
          </button>
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
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [image] = useImage(imageUrl);
  const stageContainerRef = useRef(null);
  const inputRef = useRef(null);
  const textRefs = useRef({});
  const transformerRefs = useRef({});

  React.useEffect(() => {
    if (selectedTextId && transformerRefs.current[selectedTextId] && textRefs.current[selectedTextId]) {
      const textNode = textRefs.current[selectedTextId];
      const transformer = transformerRefs.current[selectedTextId];
      transformer.nodes([textNode]);
      transformer.getLayer().batchDraw();
    }
  }, [selectedTextId]);

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
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      fontSize: 48,
      textColor: "white",
      finalized: false,
    }]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCanvasClick = (e) => {
    // Only used for selecting/deselecting, not for adding text
    setSelectedTextId(null);
  };

  const finishEditingText = () => {
    if (activeTextId) {
      setTextItems(textItems.map(item => {
        if (item.id === activeTextId) {
          // Reset fontSize to 24 if empty when finishing
          const fontSize = item.fontSize === '' || item.fontSize === 0 ? 24 : item.fontSize;
          return { ...item, text: editingText, fontSize, finalized: true };
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

  const handleTextTransformEnd = (id) => {
    const textNode = textRefs.current[id];
    if (!textNode) return;
    
    const scaleX = textNode.scaleX();
    const scaleY = textNode.scaleY();
    const rotation = textNode.rotation();
    const x = textNode.x();
    const y = textNode.y();
    
    setTextItems(textItems.map(item =>
      item.id === id ? { ...item, x, y, scaleX, scaleY, rotation } : item
    ));
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


  // Calculate scale to fit image to screen width while maintaining aspect ratio
  const [stageWidth, setStageWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 360);
  const [stageHeight, setStageHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 640);

  React.useEffect(() => {
    const handleResize = () => {
      setStageWidth(window.innerWidth);
      setStageHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scaleToFitWidth = stageWidth / width;
  const scaledHeight = height * scaleToFitWidth;
  const finalScale = scaledHeight > stageHeight ? stageHeight / height : scaleToFitWidth;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-50 relative overflow-hidden">
      {/* Image Editor - Full screen */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <Stage 
            width={stageWidth} 
            height={stageHeight} 
            ref={stageRef} 
            onClick={handleCanvasClick} 
            style={{
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            >
              <Layer>
                {image && <KonvaImage image={image} width={width} height={height} x={(stageWidth - width * finalScale) / 2 / finalScale} y={(stageHeight - height * finalScale) / 2 / finalScale} scaleX={finalScale} scaleY={finalScale} />}
                {textItems.map((item) => (
                  <React.Fragment key={item.id}>
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
                            setTextItems(prevItems => prevItems.map(textItem =>
                              textItem.id === item.id ? { 
                                ...textItem, 
                                x: textNode.x(), 
                                y: textNode.y(),
                                scaleX: textNode.scaleX(),
                                scaleY: textNode.scaleY(),
                                rotation: textNode.rotation()
                              } : textItem
                            ));
                          }
                        }}
                        rotateEnabled={true}
                        resizeEnabled={true}
                        enabledAnchors={['top-left', 'top-center', 'top-right', 'middle-right', 'middle-left', 'bottom-left', 'bottom-center', 'bottom-right']}
                        boundBoxFunc={(oldBox, newBox) => newBox}
                      />
                    )}
                  </React.Fragment>
                ))}
              </Layer>
            </Stage>
      </div>

      {/* Floating Text Controls - Top */}
      {activeTextId !== null && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-slate-900 bg-opacity-40 border border-slate-700 rounded-2xl overflow-y-auto max-h-64 backdrop-blur-sm">
          {/* Text Editing Input */}
          {activeTextId !== null && (
            <div className="px-4 py-3 border-b border-slate-700">
              <label className="text-xs text-slate-400 uppercase font-semibold block mb-2">Edit Text</label>
              <div className="flex gap-2 mb-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editingText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finishEditingText();
                  }}
                  className="flex-1 bg-slate-800 text-slate-50 border border-slate-700 rounded-lg p-2 text-sm focus:border-slate-500 focus:outline-none"
                  placeholder="Enter text..."
                />
                <div className="flex items-center gap-1">
                  <label className="text-xs text-slate-400 uppercase font-semibold whitespace-nowrap">Size:</label>
                  <input
                    type="text"
                    value={textItems.find(item => item.id === activeTextId)?.fontSize || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newSize = parseInt(val);
                      if (val === '' || !isNaN(newSize)) {
                        // Allow any value while typing
                        setTextItems(textItems.map(item =>
                          item.id === activeTextId ? { ...item, fontSize: val === '' ? '' : newSize } : item
                        ));
                      }
                    }}
                    className="w-16 bg-slate-800 text-slate-50 border border-slate-700 rounded-lg p-2 text-sm focus:border-slate-500 focus:outline-none"
                    placeholder="24"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-slate-400 uppercase font-semibold whitespace-nowrap">Color:</label>
                  <input
                    type="color"
                    value={textItems.find(item => item.id === activeTextId)?.textColor || '#ffffff'}
                    onChange={(e) => {
                      setTextItems(textItems.map(item =>
                        item.id === activeTextId ? { ...item, textColor: e.target.value } : item
                      ));
                    }}
                    className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg p-1 cursor-pointer"
                  />
                </div>
              </div>
              <button
                onClick={finishEditingText}
                className="w-full bg-slate-600 hover:bg-slate-700 text-slate-50 py-1 text-sm rounded-lg font-semibold transition"
              >
                Done
              </button>
            </div>
          )}
          {textItems.filter(item => item.finalized).length > 0 && (
            <div className="space-y-1 px-4 py-3">
              <p className="text-xs text-slate-400 uppercase font-semibold">Added Text</p>
              {textItems.filter(item => item.finalized).map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700 text-sm">
                  <span 
                    className="flex-1 cursor-pointer hover:text-slate-300 transition" 
                    onClick={() => editExistingText(item.id, item.text, item.x, item.y)}
                  >
                    {item.text || "(empty)"}
                  </span>
                  <button
                    onClick={() => deleteText(item.id)}
                    className="text-slate-400 hover:text-slate-300 transition ml-2 text-xs font-semibold"
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
      <div className="absolute top-4 left-4 z-20">
        <button 
          onClick={reset} 
          className="bg-slate-600 hover:bg-slate-700 text-slate-50 w-10 h-10 rounded-full transition flex items-center justify-center opacity-70 hover:opacity-100"
          title="Back"
        >
          ✕
        </button>
      </div>

      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => addTextAtPosition(width / 2 - 50, height / 2)}
          className="bg-slate-600 hover:bg-slate-700 text-slate-50 w-10 h-10 rounded-full font-bold transition flex items-center justify-center text-xl opacity-70 hover:opacity-100"
          title="Add Text"
        >
          +
        </button>
        <button 
          onClick={uploadImage} 
          className="bg-slate-600 hover:bg-slate-700 text-slate-50 px-4 py-2 rounded-full transition flex items-center justify-center gap-2 opacity-70 hover:opacity-100"
          title="Post"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Post
        </button>
      </div>
    </div>
  );
}