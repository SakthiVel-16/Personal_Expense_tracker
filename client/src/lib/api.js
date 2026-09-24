import axios from 'axios'

const api = axios.create({ baseURL: 'https://early-plants-appear.loca.lt' })

export default api