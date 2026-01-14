import { agent } from ".";
import { GetWeather, GetPopulation } from "./tools/randomTools";

agent.bindTools([GetWeather, GetPopulation]);
