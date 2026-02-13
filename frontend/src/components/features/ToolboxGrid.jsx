import { useState } from 'react'
import {
  Link as LinkIcon,
  PenTool,
  Layout,
  Figma,
  BookOpen,
  HardDrive,
  MessageSquare,
  Video,
  Image,
  Palette,
  Type,
  Globe,
  Code,
  Music,
  Camera,
  Mic,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import GlowCard from '@/components/ui/GlowCard'
import Button from '@/components/ui/Button'
import { spacing, typography, colours } from '@/config/tokens'

const ICON_MAP = {
  'link': LinkIcon,
  'pen-tool': PenTool,
  'layout': Layout,
  'figma': Figma,
  'book-open': BookOpen,
  'hard-drive': HardDrive,
  'message-square': MessageSquare,
  'video': Video,
  'image': Image,
  'palette': Palette,
  'type': Type,
  'globe': Globe,
  'code': Code,
  'music': Music,
  'camera': Camera,
  'mic': Mic,
}

function getIcon(iconName) {
  return ICON_MAP[iconName] || LinkIcon
}

export default function ToolboxGrid({ tools = [], editable = false, onEdit, onDelete }) {
  const [hoveredId, setHoveredId] = useState(null)

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: spacing[4],
      }}>
        {tools.map(tool => {
          const Icon = getIcon(tool.icon_name)
          const isHovered = hoveredId === tool.id

          return (
            <GlowCard
              key={tool.id}
              glowOnHover
              style={{
                padding: spacing[5],
                position: 'relative',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 150ms ease',
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
              }}
              onClick={() => {
                if (!editable) {
                  window.open(tool.url, '_blank', 'noopener,noreferrer')
                }
              }}
              onMouseEnter={() => setHoveredId(tool.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {editable && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  display: 'flex',
                  gap: '4px',
                }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onEdit?.(tool) }}
                    icon={<Pencil size={14} />}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onDelete?.(tool) }}
                    icon={<Trash2 size={14} />}
                  />
                </div>
              )}

              <div style={{ marginBottom: spacing[3] }}>
                <Icon size={24} style={{ color: '#ffffff' }} />
              </div>
              <div style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: spacing[1],
              }}>
                {tool.name}
              </div>
              {tool.description && (
                <div style={{
                  fontSize: '12px',
                  color: colours.neutral[500],
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {tool.description}
                </div>
              )}
              {!editable && isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  color: colours.neutral[500],
                }}>
                  <ExternalLink size={12} />
                </div>
              )}
            </GlowCard>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .toolbox-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .toolbox-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}

export { ICON_MAP }
