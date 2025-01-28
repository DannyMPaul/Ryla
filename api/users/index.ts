interface ApiRequest {
  method: string;
  body?: any;
}

interface ApiResponse {
  status: (code: number) => void;
  json: (data: any) => void;
}

const handler = (req: ApiRequest, res: ApiResponse) => {
  // your API handler code
};

export default handler; 