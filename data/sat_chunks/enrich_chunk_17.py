import json
import os

input_path = r"c:\Users\MY PC\Documents\GitHub\hivocab\data\sat_chunks\chunk_17.json"
output_path = r"c:\Users\MY PC\Documents\GitHub\hivocab\data\sat_chunks\chunk_17_enriched.json"

with open(input_path, "r", encoding="utf-8") as f:
    raw_data = json.load(f)

enrichments = {
    801: {
        "phonetic": "/dɪˈflekt/",
        "pos": "v.",
        "vi_meaning": "Làm lệch hướng, chuyển hướng",
        "example_sentence": "Rather than addressing the auditor's pointed inquiries regarding the misallocated funds, the spokesperson attempted to deflect scrutiny by questioning the committee's political impartiality."
    },
    802: {
        "phonetic": "/diːˈfoʊ.li.eɪt/",
        "pos": "v.",
        "vi_meaning": "Làm rụng lá, làm trơ cành",
        "example_sentence": "During the prolonged counterinsurgency campaign, military strategists authorized chemical spraying to defoliate dense jungle canopies and strip enemy fighters of natural concealment."
    },
    803: {
        "phonetic": "/dɪˈfreɪ/",
        "pos": "v.",
        "vi_meaning": "Thanh toán, chi trả (chi phí)",
        "example_sentence": "The civic endowment was established specifically to defray tuition expenses and laboratory fees for promising underprivileged scholars pursuing doctoral research."
    },
    804: {
        "phonetic": "/deft/",
        "pos": "adj.",
        "vi_meaning": "Khéo léo, nhanh nhẹn, tinh tế",
        "example_sentence": "Through deft diplomatic maneuvering and subtle textual compromises, the veteran envoy negotiated a landmark ceasefire without surrendering sovereign territory."
    },
    805: {
        "phonetic": "/dɪˈfʌŋkt/",
        "pos": "adj.",
        "vi_meaning": "Không còn tồn tại, ngừng hoạt động",
        "example_sentence": "Archival researchers examined surviving ledgers from the defunct trading guild, reconstructing how catastrophic banking panics caused its sudden dissolution in 1873."
    },
    806: {
        "phonetic": "/diːˈfjuːz/",
        "pos": "v.",
        "vi_meaning": "Tháo ngòi nổ, xoa dịu căng thẳng",
        "example_sentence": "The foreign minister convened emergency bilateral talks in Geneva to defuse mounting cross-border hostility before military mobilizations escalated into open warfare."
    },
    807: {
        "phonetic": "/dɪˈdʒen.ə.reɪt/",
        "pos": "v.",
        "vi_meaning": "Thoái hóa, suy đồi, biến chất",
        "example_sentence": "In his critique of republican governance, the philosopher warned that unchecked factional polarization would inevitably cause democratic deliberations to degenerate into mob rule."
    },
    808: {
        "phonetic": "/ˌdeɡ.rəˈdeɪ.ʃən/",
        "pos": "n.",
        "vi_meaning": "Sự suy thoái, sự xuống cấp",
        "example_sentence": "Marine biologists attributed the rapid ecological degradation of coral barrier reefs to rising sea temperatures, agricultural runoff, and coastal industrialization."
    },
    809: {
        "phonetic": "/diːˈhaɪ.dreɪt/",
        "pos": "v.",
        "vi_meaning": "Làm mất nước, làm khô cạn",
        "example_sentence": "Prolonged exposure to the scorching desert winds threatened to dehydrate the stranded geological survey team, compelling them to ration their dwindling water supplies with extreme parsimony."
    },
    810: {
        "phonetic": "/ˈdiː.ɪ.faɪ/",
        "pos": "v.",
        "vi_meaning": "Tôn sùng như thần, thần thánh hóa",
        "example_sentence": "Seeking to legitimize autocratic authority and command unquestioning obedience, ancient imperial dynasties routinely orchestrated religious rituals to deify deceased sovereigns."
    },
    811: {
        "phonetic": "/deɪn/",
        "pos": "v.",
        "vi_meaning": "Hạ mình, chiếu cố làm điều gì",
        "example_sentence": "Convinced of his patrician lineage and aesthetic superiority, the reclusive composer would not deign to respond to critical reviews penned by municipal journalists."
    },
    812: {
        "phonetic": "/dɪˈlek.tə.bəl/",
        "pos": "adj.",
        "vi_meaning": "Ngon lành, thú vị, hấp dẫn",
        "example_sentence": "Attendants at the renaissance feast marvelled at the delectable pastries infused with saffron and almond paste, which were presented on ornate silver platters beneath candlelit vaults."
    },
    813: {
        "phonetic": "/dɪˈliːt/",
        "pos": "v.",
        "vi_meaning": "Xóa bỏ, gạch bỏ",
        "example_sentence": "Before releasing the historical transcripts to the public, the intelligence review board was legally required to delete redacted paragraphs containing classified operative identities."
    },
    814: {
        "phonetic": "/ˌdel.əˈtɪr.i.əs/",
        "pos": "adj.",
        "vi_meaning": "Có hại, độc hại, gây tổn hại",
        "example_sentence": "Longitudinal epidemiological studies established that chronic sleep fragmentation exerts deleterious effects on cardiovascular health and executive cognitive functioning."
    },
    815: {
        "phonetic": "/dɪˈlɪb.ər.ət/",
        "pos": "adj.",
        "vi_meaning": "Có tính toán, thận trọng, cố ý",
        "example_sentence": "The constitutional framers instituted overlapping bicameral review as a deliberate mechanism to slow legislative passage and guard against impulsive popular passions."
    },
    816: {
        "phonetic": "/dɪˈlɪn.i.eɪt/",
        "pos": "v.",
        "vi_meaning": "Phác họa, mô tả chi tiết, phân định rõ",
        "example_sentence": "The boundary treaty signed in Paris sought to delineate disputed territorial borders along natural alpine ridges, eliminating jurisdictional ambiguities between neighboring states."
    },
    817: {
        "phonetic": "/dɪˈlɪr.i.əm/",
        "pos": "n.",
        "vi_meaning": "Sự mê sảng, trạng thái cuồng loạn",
        "example_sentence": "Plagued by virulent septic fever, the wounded soldier lapsed into a state of restless delirium, hallucinating phantom voices and reliving artillery barrages."
    },
    818: {
        "phonetic": "/dɪˈluːd/",
        "pos": "v.",
        "vi_meaning": "Lừa dối, đánh lừa, làm cho lầm tưởng",
        "example_sentence": "Authoritarian regimes frequently employ fabricated economic statistics to delude the citizenry into believing that national production remains robust amid catastrophic shortages."
    },
    819: {
        "phonetic": "/ˈdel.juːdʒ/",
        "pos": "n.",
        "vi_meaning": "Trận đại hồng thủy, sự tràn ngập dồn dập",
        "example_sentence": "When torrential monsoon storms shattered the earthen reservoir walls, an unstoppable deluge inundated downstream farming communities and wrecked regional transportation infrastructure."
    },
    820: {
        "phonetic": "/dɪˈluː.ʒən/",
        "pos": "n.",
        "vi_meaning": "Ảo tưởng, niềm tin sai lầm",
        "example_sentence": "Blind to impending fiscal bankruptcy, the company's executive board clung to the stubborn delusion that consumer demand for obsolete technology would miraculously rebound."
    },
    821: {
        "phonetic": "/delv/",
        "pos": "v.",
        "vi_meaning": "Đào sâu, nghiên cứu kỹ lưỡng",
        "example_sentence": "To resolve the longstanding anthropological enigma, the research team had to delve into centuries of church baptismal registries and colonial census rolls."
    },
    822: {
        "phonetic": "/ˈdem.ə.ɡɑːɡ/",
        "pos": "n.",
        "vi_meaning": "Kẻ mị dân, nhà chính trị kích động quần chúng",
        "example_sentence": "Historians observed that the populist demagogue rose to power by scapegoating ethnic minorities and exploiting widespread economic distress with incendiary rhetoric."
    },
    823: {
        "phonetic": "/dɪˈmiːn/",
        "pos": "v.",
        "vi_meaning": "Hạ thấp phẩm giá, làm nhục",
        "example_sentence": "Advocates for penal reform argued that subjecting incarcerated individuals to degrading public humiliation served only to demean their human spirit without deterring future crime."
    },
    824: {
        "phonetic": "/dɪˈmiː.nər/",
        "pos": "n.",
        "vi_meaning": "Cử chỉ, thái độ, phong thái",
        "example_sentence": "Despite hostile interruptions from opposition lawmakers, the prime minister maintained a remarkably composed demeanor, answering contentious allegations with measured cadence."
    },
    825: {
        "phonetic": "/dɪˈmen.tɪd/",
        "pos": "adj.",
        "vi_meaning": "Loạn trí, điên cuồng, mất trí",
        "example_sentence": "Cut off from communication in the arctic wasteland, the stranded expedition commander succumbed to demented suspicions, imagining insubordination among his most dutiful officers."
    },
    826: {
        "phonetic": "/dɪˈmaɪz/",
        "pos": "n.",
        "vi_meaning": "Cái chết, sự sụp đổ, sự lụi tàn",
        "example_sentence": "Archaeological excavations confirmed that abrupt megadroughts and resource overexploitation precipitated the sudden demise of the once-flourishing Bronze Age civilization."
    },
    827: {
        "phonetic": "/ˌdem.əˈlɪʃ.ən/",
        "pos": "n.",
        "vi_meaning": "Sự phá hủy, sự đánh sập",
        "example_sentence": "Civic heritage coalitions mobilized intense public opposition against the planned demolition of the historic Beaux-Arts opera house in favor of a commercial parking garage."
    },
    828: {
        "phonetic": "/dɪˈmoʊ.ni.æk/",
        "pos": "adj.",
        "vi_meaning": "Ma quỷ, cuồng loạn, quỷ ám",
        "example_sentence": "In Mary Shelley's gothic narrative, Victor Frankenstein beheld his monstrous creation with horror, recoiling from the creature's demoniac grimace and unnatural physical stature."
    },
    829: {
        "phonetic": "/dɪˈmɜːr/",
        "pos": "v.",
        "vi_meaning": "Phản đối, ngần ngại, do dự",
        "example_sentence": "Although the cabinet advocated immediate martial law, the chief justice did not hesitate to demur, insisting that constitutional safeguards could not be suspended during peacetime."
    },
    830: {
        "phonetic": "/dɪˈmjʊr/",
        "pos": "adj.",
        "vi_meaning": "Kín đáo, e dè, thùy mị",
        "example_sentence": "Behind her modest attire and demure bearing lay an astute political mind that deftly orchestrated backchannel negotiations between hostile factional leaders."
    },
    831: {
        "phonetic": "/diːˈmɪs.tɪ.faɪ/",
        "pos": "v.",
        "vi_meaning": "Làm sáng tỏ, làm rõ (điều phức tạp)",
        "example_sentence": "The documentary series aimed to demystify complex macroeconomic monetary policies, translating abstruse econometric modeling into lucid visual concepts for ordinary citizens."
    },
    832: {
        "phonetic": "/ˈden.ɪ.ɡreɪt/",
        "pos": "v.",
        "vi_meaning": "Gièm pha, bôi nhọ, hạ thấp phẩm giá",
        "example_sentence": "Rather than evaluating the merits of the breakthrough cosmological hypothesis, established academics unfairly sought to denigrate the young astronomer's empirical methodology."
    },
    833: {
        "phonetic": "/ˈden.ɪ.zən/",
        "pos": "n.",
        "vi_meaning": "Cư dân, động thực vật bản địa",
        "example_sentence": "Adapted to survive in perpetual darkness beneath extreme hydrostatic pressure, the viperfish reigns as a formidable denizen of the oceanic bathypelagic zone."
    },
    834: {
        "phonetic": "/ˌdiː.noʊˈteɪ.ʃən/",
        "pos": "n.",
        "vi_meaning": "Nghĩa đen, định nghĩa trực tiếp",
        "example_sentence": "While the literal denotation of the word 'sanctuary' signifies a sacred place or protective shelter, its poetic connotation frequently evokes spiritual solace and redemption."
    },
    835: {
        "phonetic": "/deɪˈnuː.mɑː/",
        "pos": "n.",
        "vi_meaning": "Hồi kết, đoạn kết mở nút (cốt truyện)",
        "example_sentence": "In the gripping denouement of the courtroom thriller, a long-hidden diary is produced that conclusively proves the accused diplomat had been framed by corporate conspirators."
    },
    836: {
        "phonetic": "/dɪˈpɪkt/",
        "pos": "v.",
        "vi_meaning": "Miêu tả, khắc họa, thể hiện",
        "example_sentence": "Nineteenth-century realist painters eschewed idealized pastoral mythologies to depict the grueling physical toil endured by agrarian laborers during the autumn wheat harvest."
    },
    837: {
        "phonetic": "/dɪˈpliːt/",
        "pos": "v.",
        "vi_meaning": "Làm cạn kiệt, làm suy giảm",
        "example_sentence": "Industrial extraction of groundwater has outpaced natural recharge rates, threatening to deplete deep subterranean aquifers essential for continental agriculture."
    },
    838: {
        "phonetic": "/dɪˈplɔːr/",
        "pos": "v.",
        "vi_meaning": "Lên án mạnh mẽ, than trách sâu sắc",
        "example_sentence": "International human rights monitors issued a joint declaration to deplore the unlawful imprisonment of independent journalists and the suppression of judicial independence."
    },
    839: {
        "phonetic": "/dɪˈplɔɪ/",
        "pos": "v.",
        "vi_meaning": "Triển khai, dàn quân, huy động",
        "example_sentence": "To contain the virulent bacterial outbreak before it crossed regional borders, health authorities moved quickly to deploy epidemiology units and mobile laboratory field units."
    },
    840: {
        "phonetic": "/dɪˈpoʊz/",
        "pos": "v.",
        "vi_meaning": "Phế truất, cách chức",
        "example_sentence": "Prompted by years of systematic corruption and economic collapse, a coalition of civilian leaders and military dissidents moved to depose the autocratic head of state."
    },
    841: {
        "phonetic": "/ˌdep.əˈzɪʃ.ən/",
        "pos": "n.",
        "vi_meaning": "Lời khai hữu thệ, sự phế truất, sự lắng đọng",
        "example_sentence": "During her videotaped deposition, the corporate whistleblower confirmed under oath that pharmaceutical executives had known about severe adverse drug side effects for years."
    },
    842: {
        "phonetic": "/dɪˈpræv.ə.ti/",
        "pos": "n.",
        "vi_meaning": "Sự suy đồi đạo đức, tính đồi bại",
        "example_sentence": "Philosophical treatises examining wartime atrocities argue that prolonged exposure to dehumanizing brutality can erode conscience and foster shocking moral depravity."
    },
    843: {
        "phonetic": "/ˈdep.rə.keɪt/",
        "pos": "v.",
        "vi_meaning": "Phản đối kịch liệt, xem nhẹ",
        "example_sentence": "Fiscal conservatives in the senate rose to deprecate the omnibus expenditure bill, warning that unfunded municipal subsidies would accelerate national debt accumulation."
    },
    844: {
        "phonetic": "/dɪˈpriː.ʃi.eɪt/",
        "pos": "v.",
        "vi_meaning": "Giảm giá trị, sụt giảm giá trị",
        "example_sentence": "When international commodity markets collapsed, capital flight caused the export-reliant nation's currency to depreciate precipitously against the reserve currency."
    },
    845: {
        "phonetic": "/ˌdep.rəˈdeɪ.ʃən/",
        "pos": "n.",
        "vi_meaning": "Sự cướp bóc, sự tàn phá hủy hoại",
        "example_sentence": "Centuries of relentless coastal depredation by North African corsairs forced Mediterranean islanders to abandon unprotected fishing ports for fortified hill retreats."
    },
    846: {
        "phonetic": "/dɪˈreɪndʒd/",
        "pos": "adj.",
        "vi_meaning": "Loạn trí, hoảng loạn, điên loạn",
        "example_sentence": "Forensic psychiatric examiners concluded that the accused was deeply deranged at the moment of the assault, suffering from acute psychotic breaks that impaired reality testing."
    },
    847: {
        "phonetic": "/ˈder.ə.lɪkt/",
        "pos": "adj.",
        "vi_meaning": "Bị bỏ hoang, tiêu điều, lơ là trách nhiệm",
        "example_sentence": "Following decades of deindustrialization, the derelict iron foundry stood decaying along the riverbank, its shattered skylights framing rust-encrusted machinery."
    },
    848: {
        "phonetic": "/dɪˈraɪd/",
        "pos": "v.",
        "vi_meaning": "Chế nhạo, giễu cợt, khinh bỉ",
        "example_sentence": "Conservative medical authorities initially chose to deride Ignaz Semmelweis's handwashing mandates, mocking the revolutionary idea that physician hygiene prevented fatal puerperal fever."
    },
    849: {
        "phonetic": "/dɪˈrɪv.ə.tɪv/",
        "pos": "adj.",
        "vi_meaning": "Bắt chước, không có tính nguyên bản",
        "example_sentence": "Art critics conceded that the painter possessed impeccable brush technique, yet they ultimately judged the exhibition to be derivative of early twentieth-century Cubist masterpieces."
    },
    850: {
        "phonetic": "/ˌdɜːr.məˈtɑː.lə.dʒɪst/",
        "pos": "n.",
        "vi_meaning": "Bác sĩ da liễu, chuyên gia da liễu",
        "example_sentence": "Detecting asymmetrical borders and varied pigmentation during a routine dermoscopic examination, the attentive dermatologist performed an immediate excision to evaluate the suspect lesion."
    }
}

enriched_list = []
for item in raw_data:
    order = item["global_order"]
    assert order in enrichments, f"Missing enrichment for {order}: {item.get('word')}"
    enrichment = enrichments[order]
    
    enriched_item = {
        "global_order": item["global_order"],
        "word": item["word"],
        "phonetic": enrichment["phonetic"],
        "pos": enrichment["pos"],
        "en_meaning": item["en_meaning"],
        "vi_meaning": enrichment["vi_meaning"],
        "example_sentence": enrichment["example_sentence"],
        "lesson_name": item["lesson_name"],
        "lesson_order": item["lesson_order"],
        "word_order": item["word_order"]
    }
    enriched_list.append(enriched_item)

# Validate all items
expected_fields = ["global_order", "word", "phonetic", "pos", "en_meaning", "vi_meaning", "example_sentence", "lesson_name", "lesson_order", "word_order"]
for idx, entry in enumerate(enriched_list):
    for f in expected_fields:
        assert f in entry and entry[f] is not None, f"Field {f} missing or None in entry {entry['word']}"
    
    # Check phonetic
    p = entry["phonetic"]
    assert p.startswith("/") and p.endswith("/"), f"Phonetic not in slashes: {p} in {entry['word']}"
    assert len(p) > 2, f"Phonetic empty: {p}"
    
    # Check pos
    assert entry["pos"] in ["v.", "n.", "adj.", "adv."], f"Invalid pos: {entry['pos']} in {entry['word']}"
    
    # Check vi_meaning: no trailing period
    assert not entry["vi_meaning"].endswith("."), f"vi_meaning has trailing period: {entry['vi_meaning']}"
    
    # Check example_sentence
    s = entry["example_sentence"]
    assert len(s) > 40, f"Sentence too short: {s}"
    w = entry["word"].lower()
    stem = w[:4] if len(w) > 4 else w
    assert stem in s.lower(), f"Word stem '{stem}' not found in sentence: {s}"

# Save output
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(enriched_list, f, ensure_ascii=False, indent=2)

print(f"Successfully enriched {len(enriched_list)} words and written to {output_path}")
