import type { Input } from "../types/input"
import axios from "./axios-instance"

export const analyzeRing = async (data: Input) => {
  const response = await axios.post("/analyze", data)
  return response.data
}