
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from '@react-email/components';
import * as React from 'react';

interface InviteUserEmailProps {
  inviteUrl: string;
  inviterName?: string;
  inviteeEmail?: string;
}

export const InviteUserEmail = ({
  inviteUrl,
  inviterName = 'A cosmic friend',
  inviteeEmail,
}: InviteUserEmailProps) => (
  <Html>
    <Head />
    <Preview>You've been invited to discover your cosmic match!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🌟 You're Invited! 🌟</Heading>
        </Section>
        
        <Section style={content}>
          <Text style={greeting}>
            Hello future star! ✨
          </Text>
          
          <Text style={text}>
            <strong style={highlight}>{inviterName}</strong> believes the universe 
            has something special in store for you! They've invited you to join our 
            cosmic dating community where the stars guide you to your perfect match.
          </Text>
          
          <Text style={text}>
            Our astrological dating platform uses the ancient wisdom of the stars 
            to help you discover deeply compatible connections. No more random swiping - 
            let celestial science guide your heart!
          </Text>
          
          <Section style={buttonContainer}>
            <Link href={inviteUrl} style={button}>
              🌙 Accept Cosmic Invitation 🌙
            </Link>
          </Section>
          
          <Text style={text}>
            What awaits you in the cosmic realm:
          </Text>
          
          <Text style={listItem}>🔮 Personalized astrological compatibility scores</Text>
          <Text style={listItem}>⭐ Matches based on your birth chart analysis</Text>
          <Text style={listItem}>💫 Deep insights into relationship dynamics</Text>
          <Text style={listItem}>🌌 A community of spiritually-minded souls</Text>
          
          <Text style={highlightBox}>
            <strong>Special Invitation Bonus:</strong> Join now and get premium 
            astrological insights for your first month! 🎁
          </Text>
          
          <Text style={smallText}>
            If the button doesn't work, copy and paste this link into your browser:
          </Text>
          <Text style={linkText}>{inviteUrl}</Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            The stars are aligning for your arrival! 🌠
          </Text>
          <Text style={footerText}>
            With celestial wishes,<br />
            The Astro Dating Community
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#0f0f23',
  fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
  backgroundColor: '#1a1a2e',
  borderRadius: '12px',
  border: '1px solid #4c1d95',
};

const header = {
  textAlign: 'center' as const,
  padding: '20px 0',
  background: 'linear-gradient(135deg, #ec4899, #7c3aed, #3b82f6)',
  borderRadius: '8px',
  marginBottom: '30px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 20px',
};

const greeting = {
  color: '#f472b6',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 20px 0',
};

const text = {
  color: '#e2e8f0',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const highlight = {
  color: '#f472b6',
  fontWeight: 'bold',
};

const listItem = {
  color: '#e2e8f0',
  fontSize: '14px',
  margin: '8px 0',
  paddingLeft: '10px',
};

const highlightBox = {
  backgroundColor: '#7c3aed',
  color: '#ffffff',
  padding: '15px',
  borderRadius: '8px',
  fontSize: '14px',
  margin: '20px 0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#ec4899',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  border: '2px solid #f472b6',
  background: 'linear-gradient(135deg, #ec4899, #f472b6)',
};

const smallText = {
  color: '#94a3b8',
  fontSize: '14px',
  margin: '20px 0 10px 0',
};

const linkText = {
  color: '#60a5fa',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  margin: '0 0 20px 0',
};

const footer = {
  textAlign: 'center' as const,
  padding: '30px 20px 20px',
  borderTop: '1px solid #374151',
  marginTop: '30px',
};

const footerText = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: '8px 0',
};

export default InviteUserEmail;
