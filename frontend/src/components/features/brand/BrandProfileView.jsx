import { Card } from '@/components/ui'
import ColourSwatch from '@/components/ui/ColourSwatch'
import { colours, spacing } from '@/config/tokens'

/**
 * BrandProfileView
 *
 * Read-only brand profile display — premium, magazine-style layout.
 * Shows: logo (large), colour swatches, voice/tone, core values, mission statement,
 * target audience, dos and don'ts. Clean, spacious layout.
 */
export default function BrandProfileView({ profile, clientName, companyName }) {
  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: spacing[10], color: colours.neutral[500] }}>
        <p>No brand profile available</p>
      </div>
    )
  }

  const brandColours = profile.brand_colours ? JSON.parse(profile.brand_colours) : []

  return (
    <div className="brand-profile-view" style={{
      maxWidth: '900px',
      margin: '0 auto',
    }}>
      {/* Header Section */}
      <div style={{
        textAlign: 'center',
        paddingBottom: spacing[8],
        borderBottom: `2px solid ${colours.neutral[200]}`,
        marginBottom: spacing[8],
      }}>
        {profile.logo_path && (
          <img
            src={profile.logo_path}
            alt={`${clientName} logo`}
            style={{
              maxWidth: '300px',
              maxHeight: '150px',
              objectFit: 'contain',
              marginBottom: spacing[5],
            }}
          />
        )}
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: colours.neutral[900],
          marginBottom: spacing[2],
        }}>
          {clientName}
        </h1>
        {companyName && (
          <p style={{
            fontSize: '18px',
            color: colours.neutral[600],
          }}>
            {companyName}
          </p>
        )}
      </div>

      {/* Brand Colours */}
      {brandColours.length > 0 && (
        <ProfileSection title="Brand Colours">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: spacing[4],
          }}>
            {brandColours.map((colour, index) => (
              <ColourSwatch
                key={index}
                name={colour.name}
                hex={colour.hex}
              />
            ))}
          </div>
        </ProfileSection>
      )}

      {/* Voice & Tone */}
      {profile.voice_tone && (
        <ProfileSection title="Voice & Tone">
          <p style={{
            fontSize: '15px',
            lineHeight: 1.8,
            color: colours.neutral[700],
            whiteSpace: 'pre-wrap',
          }}>
            {profile.voice_tone}
          </p>
        </ProfileSection>
      )}

      {/* Core Values */}
      {profile.core_values && (
        <ProfileSection title="Core Values">
          <p style={{
            fontSize: '15px',
            lineHeight: 1.8,
            color: colours.neutral[700],
            whiteSpace: 'pre-wrap',
          }}>
            {profile.core_values}
          </p>
        </ProfileSection>
      )}

      {/* Mission Statement */}
      {profile.mission_statement && (
        <ProfileSection title="Mission Statement">
          <div style={{
            padding: spacing[5],
            backgroundColor: colours.primary[50],
            borderLeft: `4px solid ${colours.primary[500]}`,
            borderRadius: '8px',
          }}>
            <p style={{
              fontSize: '16px',
              lineHeight: 1.8,
              color: colours.neutral[800],
              fontStyle: 'italic',
              whiteSpace: 'pre-wrap',
            }}>
              {profile.mission_statement}
            </p>
          </div>
        </ProfileSection>
      )}

      {/* Target Audience */}
      {profile.target_audience && (
        <ProfileSection title="Target Audience">
          <p style={{
            fontSize: '15px',
            lineHeight: 1.8,
            color: colours.neutral[700],
            whiteSpace: 'pre-wrap',
          }}>
            {profile.target_audience}
          </p>
        </ProfileSection>
      )}

      {/* Dos and Don'ts */}
      {(profile.dos || profile.donts) && (
        <ProfileSection title="Brand Guidelines">
          <div style={{
            display: 'grid',
            gridTemplateColumns: profile.dos && profile.donts ? '1fr 1fr' : '1fr',
            gap: spacing[6],
          }}>
            {profile.dos && (
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colours.success[700],
                  marginBottom: spacing[3],
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}>
                  <span style={{ fontSize: '20px' }}>✓</span> Do
                </h4>
                <p style={{
                  fontSize: '15px',
                  lineHeight: 1.8,
                  color: colours.neutral[700],
                  whiteSpace: 'pre-wrap',
                }}>
                  {profile.dos}
                </p>
              </div>
            )}
            {profile.donts && (
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colours.error[700],
                  marginBottom: spacing[3],
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                }}>
                  <span style={{ fontSize: '20px' }}>✗</span> Don't
                </h4>
                <p style={{
                  fontSize: '15px',
                  lineHeight: 1.8,
                  color: colours.neutral[700],
                  whiteSpace: 'pre-wrap',
                }}>
                  {profile.donts}
                </p>
              </div>
            )}
          </div>
        </ProfileSection>
      )}

      {/* Additional Notes */}
      {profile.additional_notes && (
        <ProfileSection title="Additional Notes">
          <p style={{
            fontSize: '15px',
            lineHeight: 1.8,
            color: colours.neutral[700],
            whiteSpace: 'pre-wrap',
          }}>
            {profile.additional_notes}
          </p>
        </ProfileSection>
      )}
    </div>
  )
}

function ProfileSection({ title, children }) {
  return (
    <div style={{ marginBottom: spacing[8] }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 600,
        color: colours.neutral[900],
        marginBottom: spacing[4],
        paddingBottom: spacing[3],
        borderBottom: `1px solid ${colours.neutral[200]}`,
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}
