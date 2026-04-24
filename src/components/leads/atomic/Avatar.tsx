import * as React from "react"
import { getInitials } from "@/lib/lead-utils"

interface AvatarProps {
  first?: string
  last?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Avatar = React.memo(({ first, last, size = 'md' }: AvatarProps) => {
  const initials = getInitials(first, last)
  const sz = { sm: 'h-8 w-8 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm' }[size]
  const hue = [160, 150, 170, 145, 165, 155][(initials.charCodeAt(0) || 0) % 6]
  
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-semibold shrink-0 select-none`}
      style={{ 
        background: `hsl(${hue},42%,20%)`, 
        color: `hsl(${hue},65%,62%)`, 
        border: `1.5px solid hsl(${hue},45%,28%)` 
      }}
    >
      {initials}
    </div>
  )
})

Avatar.displayName = "Avatar"
