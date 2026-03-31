import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

export async function generateProgressReport(input: {
  studentName: string
  className: string
  term: string
  teacherNotes: string
  attendancePercent: number
  subjectRatings: Record<string, number>
  behaviourRating?: number
  socialSkills?: number
}): Promise<string> {
  const subjectSummary = Object.entries(input.subjectRatings)
    .map(([subject, rating]) => `${subject}: ${rating}/5`)
    .join(', ')

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [
      {
        role: 'user',
        content: `Generate a warm, encouraging kindergarten progress report.

Student: ${input.studentName}
Class: ${input.className}
Term: ${input.term}
Attendance: ${input.attendancePercent}%
Subject Ratings (out of 5): ${subjectSummary}
${input.behaviourRating ? `Behaviour: ${input.behaviourRating}/5` : ''}
${input.socialSkills ? `Social Skills: ${input.socialSkills}/5` : ''}

Teacher's Notes: ${input.teacherNotes}

Write 3 paragraphs:
1. Overall progress summary (warm, positive tone)
2. Subject-specific highlights and areas of growth
3. Encouragement and suggestions for parents

Keep it under 250 words. Use the child's first name. This is for Indian kindergarten parents.`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response format')
  return block.text
}

export async function generateAttendanceInsight(input: {
  studentName: string
  absentDays: number
  totalDays: number
  recentPattern: string
}): Promise<string> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `Student ${input.studentName} has been absent ${input.absentDays} out of ${input.totalDays} days. Pattern: ${input.recentPattern}. Generate a brief, caring alert message (2 sentences max) for the school owner about this student's attendance concern.`,
      },
    ],
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response format')
  return block.text
}
