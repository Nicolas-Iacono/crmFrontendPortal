"use client";

import PropertyMap from "./PropertyMap";

export type PropertyMapLoaderProps = {
  query: string;
  ubicacionLabel: string;
};

export default function PropertyMapLoader(props: PropertyMapLoaderProps) {
  return <PropertyMap {...props} />;
}
