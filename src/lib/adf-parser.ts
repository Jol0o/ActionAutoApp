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

    const v = prospect.vehicle
    const c = prospect.customer

    return {
      vehicle: {
        year: v?.year,
        make: v?.make,
        model: v?.model,
        trim: v?.trim,
        style: v?.bodystyle || v?.['body-style'],
        vin: v?.vin,
        stock: v?.stock,
        odometer: v?.odometer?._ || v?.odometer,
        interest: v?.$?.interest,
        status: v?.$?.status,
      },
      customer: {
        name: Array.isArray(c?.contact?.name) ? c.contact.name[0]?._ : (c?.contact?.name?._ || c?.contact?.name),
        email: c?.contact?.email,
        phone: c?.contact?.phone?._ || c?.contact?.phone,
      },
      comments: prospect.comments,
      source: prospect.id?.$?.source,
      requestDate: prospect.requestdate,
    }
  } catch (err) {
    console.error('ADF Parsing Error:', err)
    return {}
  }
}
