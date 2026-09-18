import { NextResponse } from "next/server"

// ПРЕМАХНАТ ENDPOINT — 410 Gone.
// Причина: Масово изтриване на проекти с изрично закоментирана auth проверка.
// Нямаше нито един извикващ в app/, components/, lib/, pages/ или hooks/.
// TODO: файлът трябва да бъде изтрит напълно (`git rm`); тук стои само защото
// изтриването на файлове беше блокирано в средата, в която беше направена промяната.

const gone = () =>
    NextResponse.json({ error: "This endpoint has been removed." }, { status: 410 })

export async function POST() {
    return gone()
}
