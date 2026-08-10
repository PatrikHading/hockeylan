function PrivacyPage() {
    return (
        <main
            className="mx-auto max-w-3xl"
            aria-labelledby="privacy-heading"
        >
            <article className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                <header className="border-b border-slate-200 pb-6">
                    <p className="text-sm font-bold uppercase tracking-wide text-red-700">
                        Integritet
                    </p>

                    <h1
                        id="privacy-heading"
                        className="mt-2 text-3xl font-black tracking-tight text-blue-950"
                    >
                        Så behandlar HockeyLån personuppgifter
                    </h1>

                    <p className="mt-4 leading-7 text-slate-700">
                        Den här informationen beskriver den tekniska
                        personuppgiftshanteringen i HockeyLån. Den ersätter inte
                        verksamhetens egen juridiska bedömning.
                    </p>
                </header>

                <div className="mt-8 space-y-8 text-slate-700">
                    <section aria-labelledby="collected-data">
                        <h2
                            id="collected-data"
                            className="text-xl font-black text-blue-950"
                        >
                            Uppgifter som behandlas
                        </h2>

                        <p className="mt-3 leading-7">
                            När ett lån registreras behandlar HockeyLån följande uppgifter:
                        </p>

                        <ul className="mt-3 list-disc space-y-2 pl-6">
                            <li>låntagarens namn,</li>

                            <li>e-postadress,</li>

                            <li>telefonnummer,</li>

                            <li>
                                uppgifter om den utlånade utrustningen och dess serienummer,
                            </li>

                            <li>
                                lånedatum, eventuellt förväntat återlämningsdatum och uppgift om
                                när utrustningen återlämnades.
                            </li>
                        </ul>

                        <p className="mt-3 leading-7">
                            Om administratören väljer att spara låntagaren som ett Alias
                            lagras även det valda Aliasnamnet tillsammans med en återanvändbar
                            kopia av låntagarens namn, e-postadress och telefonnummer. Ett
                            Alias behöver inte väljas eller sparas för att registrera ett lån.
                        </p>
                    </section>

                    <section aria-labelledby="processing-purpose">
                        <h2
                            id="processing-purpose"
                            className="text-xl font-black text-blue-950"
                        >
                            Varför uppgifterna behandlas
                        </h2>

                        <p className="mt-3 leading-7">
                            Uppgifterna används för att administrera utlåning, identifiera vem
                            som har lånat en viss utrustning, kontakta låntagaren om lånet och
                            följa upp återlämningen.
                        </p>

                        <p className="mt-3 leading-7">
                            Sparade Alias används för att behöriga administratörer snabbare
                            ska kunna fylla i kontaktuppgifter vid framtida utlåningar. Om
                            uppgifterna ändras efter att ett Alias har valts gäller ändringen
                            endast det aktuella lånet och ändrar inte det sparade Aliaset.
                        </p>

                        <p className="mt-3 leading-7">
                            Uppgifterna ska inte användas för marknadsföring eller andra
                            oförenliga ändamål utan att verksamheten först fattar ett särskilt
                            beslut och informerar de registrerade.
                        </p>
                    </section>

                    <section aria-labelledby="access">
                        <h2
                            id="access"
                            className="text-xl font-black text-blue-950"
                        >
                            Åtkomst och säkerhet
                        </h2>

                        <p className="mt-3 leading-7">
                            Låne- och Aliasuppgifterna är avsedda att vara tillgängliga endast
                            för behöriga administratörer. Applikationen använder
                            autentisering, åtkomstkontroll, CSRF-skydd, hastighetsbegränsning
                            och säkerhetsloggning för att minska risken för obehörig åtkomst.
                        </p>

                        <p className="mt-3 leading-7">
                            Namn, e-postadress, telefonnummer och Aliasnamn ska inte skrivas
                            till applikationens loggar. Tekniska uppgifter utan avsiktligt
                            personinnehåll kan loggas för felsökning och säkerhetsuppföljning.
                        </p>
                    </section>

                    <section aria-labelledby="cookies">
                        <h2
                            id="cookies"
                            className="text-xl font-black text-blue-950"
                        >
                            Cookies
                        </h2>

                        <p className="mt-3 leading-7">
                            HockeyLån använder tekniskt nödvändiga cookies för
                            administratörens inloggningssession och för att skydda formulär
                            och API-anrop mot CSRF-attacker.
                        </p>

                        <p className="mt-3 leading-7">
                            Applikationen använder inte cookies för reklam, profilering eller
                            besöksanalys.
                        </p>
                    </section>

                    <section aria-labelledby="retention">
                        <h2
                            id="retention"
                            className="text-xl font-black text-blue-950"
                        >
                            Lagring och radering
                        </h2>

                        <p className="mt-3 leading-7">
                            Någon lagringstid anges inte här eftersom verksamheten ännu måste
                            besluta hur länge aktiva och avslutade låneuppgifter samt sparade
                            Alias behöver behållas. Uppgifter ska inte sparas längre än vad
                            som behövs för det beslutade ändamålet.
                        </p>

                        <div
                            className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"
                            role="note"
                            aria-label="Verksamhetsbeslut krävs"
                        >
                            <p className="font-bold">
                                Verksamhetsbeslut krävs före produktion
                            </p>

                            <p className="mt-2 leading-7">
                                Verksamheten måste besluta och dokumentera lagringstid,
                                raderingsrutin för både låneuppgifter och Alias, samt eventuell
                                hantering av säkerhetskopior.
                            </p>
                        </div>
                    </section>

                    <section aria-labelledby="responsibility">
                        <h2
                            id="responsibility"
                            className="text-xl font-black text-blue-950"
                        >
                            Ansvar och kontakt
                        </h2>

                        <p className="mt-3 leading-7">
                            Verksamheten måste före produktionssättning ange vem som är
                            personuppgiftsansvarig, tillämplig rättslig grund och en
                            kontaktväg för frågor, rättelse, radering och andra registrerades
                            rättigheter.
                        </p>

                        <div
                            className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-red-950"
                            role="note"
                            aria-label="Informationen måste kompletteras"
                        >
                            <p className="font-bold">
                                Informationen måste kompletteras
                            </p>

                            <ul className="mt-2 list-disc space-y-2 pl-6">
                                <li>personuppgiftsansvarig verksamhet,</li>

                                <li>kontaktuppgifter,</li>

                                <li>rättslig grund för behandlingen,</li>

                                <li>beslutade lagrings- och raderingsperioder,</li>

                                <li>eventuella personuppgiftsbiträden och mottagare,</li>

                                <li>
                                    rutiner för att hantera registrerades rättigheter och
                                    personuppgiftsincidenter.
                                </li>
                            </ul>
                        </div>
                    </section>
                </div>
            </article>
        </main>
    );
}

export default PrivacyPage;