import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

export async function fetcher(url){
  const res = await instance.get(url)
  return res.data
}

export default instance
