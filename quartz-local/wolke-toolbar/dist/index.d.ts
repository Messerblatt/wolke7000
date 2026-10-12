import type { QuartzComponentConstructor } from "@quartz-community/types"

export type WolkeToolbarOptions = {
  /** Site absolute path of the audio file */
  src?: string
  /** Repeat the track when it ends */
  loop?: boolean
  /** Playback volume between 0 and 1 */
  volume?: number
  playLabel?: string
  muteLabel?: string
  title?: string
}

declare const WolkeToolbar: QuartzComponentConstructor<WolkeToolbarOptions>

export { WolkeToolbar }
export type { WolkeToolbarOptions }