import { parseStringPromise } from 'xml2js'

/**
 * Robust ADF XML Parser using xml2js.
 */

export interface ParsedAdfLead {
  vehicle?: {
    year?: string
    make?: string
    model?: string
    trim?: string
    style?: string
    vin?: string
    stock?: string
    odometer?: string
    interest?: string
    status?: string
  }
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  comments?: string
  source?: string
  requestDate?: string
}

export const isAdfBody = (raw: string): boolean => {
  const t = raw.toLowerCase()
  return (
    t.includes('<adf>') || t.includes('&lt;adf') ||
    t.includes('adf version') || t.includes('adf%20version') ||
    t.includes('<prospect ') || t.includes('&lt;prospect ') ||
    t.includes('<vehicle ') || t.includes('&lt;vehicle ') ||
    (t.includes('<!--?') && (t.includes('adf') || t.includes('requestdate')))
  )
}

export const parseAdf = async (raw: string): Promise<ParsedAdfLead> => {
  const decoded = raw
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, ' ')
    .replace(/<!--\?xml[^>]*-->/gi, '')
    .replace(/<!--\?ADF[^>]*-->/gi, '')
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<\?ADF[^>]*\?>/gi, '')
    .replace(/<html[^>]*>|<\/html>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>|<\/body>/gi, '')

  try {
    const result = await parseStringPromise(decoded, { explicitArray: false, ignoreAttrs: false })
    const prospect = result?.adf?.prospect || result?.prospect

    if (!prospect) return {}

    // Helper to flatten xml2js objects with { _, $ }
    const f = (node: any): string => {
      if (!node) return ''
      if (typeof node === 'string') return node
      if (node._ !== undefined) return String(node._)
      // If it's an object but not a flattened one, we try to stringify if it's simple or just return empty
      if (typeof node === 'object' && Object.keys(node).length === 0) return ''
      return String(node)
    }

    const v = prospect.vehicle
    const c = prospect.customer

    return {
      vehicle: {
        year: f(v?.year),
        make: f(v?.make),
        model: f(v?.model),
        trim: f(v?.trim),
        style: f(v?.bodystyle || v?.['body-style']),
        vin: f(v?.vin),
        stock: f(v?.stock),
        odometer: f(v?.odometer),
        interest: f(v?.$?.interest),
        status: f(v?.$?.status),
      },
      customer: {
        name: Array.isArray(c?.contact?.name) ? f(c.contact.name[0]) : f(c?.contact?.name),
        email: f(c?.contact?.email),
        phone: f(c?.contact?.phone),
      },
      comments: f(prospect.comments),
      source: f(prospect.id?.$?.source),
      requestDate: f(prospect.requestdate),
    }
  } catch (err) {
    console.error('ADF Parsing Error:', err)
    return {}
  }
}
