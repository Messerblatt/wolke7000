import { RainController, type RainOptions } from "./rain"

export interface WeatherRuntime {
  readonly rain: RainController
  startRain(options?: RainOptions): void
  stopRain(): void
}

/** Weather services shared by the browser runtime for the whole session. */
export class WeatherController implements WeatherRuntime {
  readonly rain = new RainController()

  startRain(options?: RainOptions): void {
    this.rain.start(options)
  }

  stopRain(): void {
    this.rain.stop()
  }
}

export function createWeatherRuntime(): WeatherRuntime {
  return new WeatherController()
}
