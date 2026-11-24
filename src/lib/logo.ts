export interface LogoSpace {
  area: number
  minHeight: number
  maxHeight: number
  maxWidth: number
}

export interface LogoSize {
  width: number
  height: number
  fits: boolean
}

export function logoSize(ratio: number, space: LogoSpace): LogoSize {
  const ideal = Math.sqrt(space.area / ratio)
  let height = Math.min(space.maxHeight, Math.max(space.minHeight, ideal))
  if (height * ratio > space.maxWidth) height = space.maxWidth / ratio
  const width = height * ratio
  return {
    width: Math.round(width),
    height: Math.round(height),
    fits: height >= space.minHeight && width <= space.maxWidth,
  }
}
