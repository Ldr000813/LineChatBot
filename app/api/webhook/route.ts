import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // リクエストのパース
    const body = await req.json();
    console.log('--- LINE Webhook received ---');
    console.log(JSON.stringify(body, null, 2));

    // events配列を取得（Webhookには複数のイベントが含まれる場合があります）
    const events = body.events || [];

    // 各イベントをループ処理
    for (const event of events) {
      // messageイベント（ユーザーからのメッセージ受信）の場合のみ処理
      if (event.type === 'message' && event.message.type === 'text') {
        const replyToken = event.replyToken;

        // LINEのReply APIを叩いて返信する
        const replyResponse = await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [
              {
                type: 'text',
                text: 'メッセージありがとう',
              },
            ],
          }),
        });

        // LINE APIからのレスポンスをチェック（エラーハンドリング用）
        if (!replyResponse.ok) {
          const errorText = await replyResponse.text();
          console.error(`Failed to send reply. Status: ${replyResponse.status}`, errorText);
        } else {
          console.log('Successfully sent a reply.');
        }
      }
    }

    // 処理が成功した場合、LINEへHTTP 200を返す（仕様遵守）
    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error) {
    console.error('Error handling webhook:', error);
    
    // エラーが発生した場合でも、LINEプラットフォームへはHTTP 200を返す（再送ループを防ぎ、仕様に準拠するため）
    return NextResponse.json({ status: 'error' }, { status: 200 });
  }
}
