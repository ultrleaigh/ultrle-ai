export async function POST(request) {
    try {
        const { reference } = await request.json();

        if (!reference) {
            return Response.json({ error: "No reference provided." }, { status: 400 });
        }

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (!data.status || data.data.status !== "success") {
            return Response.json({ error: "Payment verification failed." }, { status: 400 });
        }

        return Response.json({ verified: true, amount: data.data.amount, email: data.data.customer.email });

    } catch (error) {
        console.error("Verification error:", error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
}