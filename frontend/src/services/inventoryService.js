import { api } from './api'

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asObject(value) {
  return value && typeof value === 'object' ? value : {}
}

export async function listInventoryCategories(params = {}) {
  const { data } = await api.get('/inventory/categories', { params })
  return asArray(data?.categories)
}

export async function createInventoryCategory(payload = {}) {
  const { data } = await api.post('/inventory/categories', payload)
  return asObject(data?.category)
}

export async function updateInventoryCategory(id, payload = {}) {
  const { data } = await api.patch(`/inventory/categories/${id}`, payload)
  return asObject(data?.category)
}

export async function deleteInventoryCategory(id) {
  const { data } = await api.delete(`/inventory/categories/${id}`)
  return Boolean(data?.ok)
}

export async function listInventoryItems(params = {}) {
  const { data } = await api.get('/inventory/items', { params })
  return asArray(data?.items)
}

export async function createInventoryItem(payload = {}) {
  const { data } = await api.post('/inventory/items', payload)
  return asObject(data?.item)
}

export async function updateInventoryItem(id, payload = {}) {
  const { data } = await api.patch(`/inventory/items/${id}`, payload)
  return asObject(data?.item)
}

export async function deleteInventoryItem(id) {
  const { data } = await api.delete(`/inventory/items/${id}`)
  return Boolean(data?.ok)
}

export async function listInventoryStockMovements(params = {}) {
  const { data } = await api.get('/inventory/stock', { params })
  return asArray(data?.movements)
}

export async function createInventoryStockMovement(payload = {}) {
  const { data } = await api.post('/inventory/stock', payload)
  return asObject(data?.movement)
}

export async function updateInventoryStockMovement(id, payload = {}) {
  const { data } = await api.patch(`/inventory/stock/${id}`, payload)
  return asObject(data?.movement)
}

export async function deleteInventoryStockMovement(id) {
  const { data } = await api.delete(`/inventory/stock/${id}`)
  return Boolean(data?.ok)
}

export async function listInventoryDistributions(params = {}) {
  const { data } = await api.get('/inventory/distribution', { params })
  return asArray(data?.distributions)
}

export async function createInventoryDistribution(payload = {}) {
  const { data } = await api.post('/inventory/distribution', payload)
  return asObject(data?.distribution)
}

export async function updateInventoryDistribution(id, payload = {}) {
  const { data } = await api.patch(`/inventory/distribution/${id}`, payload)
  return asObject(data?.distribution)
}

export async function deleteInventoryDistribution(id) {
  const { data } = await api.delete(`/inventory/distribution/${id}`)
  return Boolean(data?.ok)
}
