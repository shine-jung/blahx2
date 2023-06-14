// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from 'next';
import FirebaseAdmin from '@/models/firebase_admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { uid, email, displayName, photoURL } = req.body;
  if (uid === undefined || uid === null) {
    return res.status(400).json({ result: false, message: 'uid가 누락되었습니다.' });
  }
  if (email === undefined || email === null) {
    return res.status(400).json({ result: false, message: 'email이 누락되었습니다.' });
  }

  /*
  Transaction : https://firebase.google.com/docs/firestore/manage-data/transactions?hl=ko
  데이터베이스의 상태를 변화시키기 위해서 수행하는 작업의 단위
  트랜젝션은 모두 데이터베이스에 반영되거나, 아니면 전혀 반영되지 않는다.
  후반부에 오류가 있으면 전반부의 작업도 모두 취소된다.
  */

  try {
    // Firebase add => key를 반환해줌
    const screenName = (email as string).split('@')[0];
    const addResult = await FirebaseAdmin.getInstance().Firebase.runTransaction(async (transaction) => {
      const memberRef = FirebaseAdmin.getInstance().Firebase.collection('members').doc(uid);
      const screenNameRef = FirebaseAdmin.getInstance().Firebase.collection('screen_names').doc(screenName);
      const memberDoc = await transaction.get(memberRef);
      if (memberDoc.exists) {
        // 이미 추가된 상태
        // throw new Error('이미 가입된 사용자입니다.');
        return false;
      }
      const addData = {
        uid,
        email,
        displayName: displayName ?? '',
        photoURL: photoURL ?? '',
      };
      await transaction.set(memberRef, addData);
      await transaction.set(screenNameRef, addData);
      return true;
    });
    if (addResult === false) {
      return res.status(201).json({ result: true, id: uid });
    }
    return res.status(200).json({ result: true, id: uid });
  } catch (err) {
    console.log(err);
    res.status(500).json({ result: false });
  }
}
