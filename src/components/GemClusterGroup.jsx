"use client";

import L from "leaflet";
import { createPathComponent } from "@react-leaflet/core";
import { MarkerClusterGroup as LeafletMarkerClusterGroup } from "leaflet.markercluster";

import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

import "leaflet.markercluster";

function createMarkerClusterGroup(props, context) {
  const { onClusterClick, ...options } = props;
  const instance = new LeafletMarkerClusterGroup({
    ...options,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();

      return L.divIcon({
        html: `
<div class="relative flex items-center justify-center text-blue-400" style="width: 40px; height: 48px;">
  <svg viewBox="0 0 24 24" class="drop-shadow-black/50 absolute inset-0 h-full w-full drop-shadow" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" />
  </svg>
  <div class="z-201 absolute left-0 right-0 top-[2px] flex h-[32px] items-center justify-center text-[13px] font-bold text-white">
    ${count}
  </div>
</div>
        `,
        className: "custom-clustericon",
        iconSize: L.point(40, 48),
        iconAnchor: [20, 48],
      });
    },
  });

  if (onClusterClick) {
    instance.on("clusterclick", onClusterClick);
  }

  return { instance, context: { ...context, layerContainer: instance } };
}

const MarkerClusterGroup = createPathComponent(createMarkerClusterGroup, (instance, props, prevProps) => {
  if (props.onClusterClick !== prevProps.onClusterClick) {
    if (prevProps.onClusterClick) {
      instance.off("clusterclick", prevProps.onClusterClick);
    }
    if (props.onClusterClick) {
      instance.on("clusterclick", props.onClusterClick);
    }
  }
});

export default MarkerClusterGroup;
