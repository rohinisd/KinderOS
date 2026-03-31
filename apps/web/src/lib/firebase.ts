import admin from 'firebase-admin'

function getMessaging() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  }
  return admin.messaging()
}

export async function sendPushNotification(params: {
  fcmToken: string
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
}): Promise<string | null> {
  if (!params.fcmToken || !process.env.FIREBASE_PROJECT_ID) return null

  try {
    return await getMessaging().send({
      token: params.fcmToken,
      notification: {
        title: params.title,
        body: params.body,
        imageUrl: params.imageUrl,
      },
      data: params.data,
      android: { priority: 'high' },
      webpush: {
        headers: { Urgency: 'high' },
        notification: { icon: '/icon-192.png' },
      },
    })
  } catch (error) {
    console.error('[FCM] Send failed:', error)
    return null
  }
}

export async function sendBulkPush(params: {
  tokens: string[]
  title: string
  body: string
  data?: Record<string, string>
}): Promise<number> {
  const validTokens = params.tokens.filter(Boolean)
  if (validTokens.length === 0 || !process.env.FIREBASE_PROJECT_ID) return 0

  const response = await getMessaging().sendEachForMulticast({
    tokens: validTokens,
    notification: { title: params.title, body: params.body },
    data: params.data,
  })

  return response.successCount
}
