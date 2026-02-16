/**
 * Brands Service
 *
 * Brand profiles, logos, guide PDFs, and extraction.
 */

import { apiFetch } from './apiFetch'

export async function createProfile(body) {
  const data = await apiFetch('/brand-profiles', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to create brand profile')
  return data.data
}

export async function getProfile(clientId) {
  const data = await apiFetch(`/brand-profiles/${clientId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch brand profile')
  return data.data
}

export async function updateProfile(clientId, body) {
  const data = await apiFetch(`/brand-profiles/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update brand profile')
  return data.data
}

export async function extractProfile(clientId, formData) {
  const data = await apiFetch(`/brand-profiles/${clientId}/extract`, {
    method: 'POST',
    body: formData,
  })
  if (!data.success) throw new Error(data.error || 'Failed to extract brand profile')
  return data.data
}

export async function getLogos(clientId) {
  const data = await apiFetch(`/brand-profiles/${clientId}/logos`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch logos')
  return data.data
}

export async function uploadLogo(clientId, formData) {
  const data = await apiFetch(`/brand-profiles/${clientId}/logos`, {
    method: 'POST',
    body: formData,
  })
  if (!data.success) throw new Error(data.error || 'Failed to upload logo')
  return data.data
}

export async function addLogo(clientId, logoData) {
  const data = await apiFetch(`/brand-profiles/${clientId}/logos`, {
    method: 'POST',
    body: JSON.stringify(logoData),
  })
  if (!data.success) throw new Error(data.error || 'Failed to add logo')
  return data.data
}

export async function deleteLogo(clientId, logoId) {
  const data = await apiFetch(`/brand-profiles/${clientId}/logos/${logoId}`, { method: 'DELETE' })
  if (!data.success) throw new Error(data.error || 'Failed to delete logo')
  return data.data
}

export async function uploadGuidePdf(clientId, formData) {
  const data = await apiFetch(`/brand-profiles/${clientId}/guide-pdf`, {
    method: 'POST',
    body: formData,
  })
  if (!data.success) throw new Error(data.error || 'Failed to upload guide PDF')
  return data.data
}

export async function updateBrandFromProfile(clientId, body) {
  const data = await apiFetch(`/brand-profiles/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!data.success) throw new Error(data.error || 'Failed to update brand')
  return data.data
}

export async function listGuides(clientId) {
  const data = await apiFetch(`/brand-guides?client_id=${clientId}`)
  if (!data.success) throw new Error(data.error || 'Failed to fetch brand guides')
  return data.data
}

export async function listAllProfiles() {
  const data = await apiFetch('/brand-profiles')
  if (!data.success) throw new Error(data.error || 'Failed to fetch brand profiles')
  return data.data
}
