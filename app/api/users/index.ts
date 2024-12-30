// import type { NextApiRequest, NextApiResponse } from 'next';
// import dbConnect from '../../../utils/mongodb';
// import User from '../../../models/User';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   await dbConnect();

//   switch (req.method) {
//     case 'POST':
//       try {
//         const user = await User.create(req.body);
//         res.status(201).json({ success: true, data: user });
//       } catch (error) {
//         res.status(400).json({ success: false, error: error.message });
//       }
//       break;

//     case 'PUT':
//       try {
//         const { firebaseUid } = req.body;
//         const updatedUser = await User.findOneAndUpdate(
//           { firebaseUid },
//           req.body,
//           { new: true, runValidators: true }
//         );
//         res.status(200).json({ success: true, data: updatedUser });
//       } catch (error) {
//         res.status(400).json({ success: false, error: error.message });
//       }
//       break;

//     case 'GET':
//       try {
//         const { firebaseUid } = req.query;
//         const user = await User.findOne({ firebaseUid });
//         res.status(200).json({ success: true, data: user });
//       } catch (error) {
//         res.status(400).json({ success: false, error: error.message });
//       }
//       break;

//     default:
//       res.status(405).json({ success: false, message: 'Method not allowed' });
//       break;
//   }
// } 