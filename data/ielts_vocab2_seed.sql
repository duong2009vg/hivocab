-- ==========================================================================
-- SQL SEED FOR IELTS BAND 7.5, PROCESS, AND QUANTIFIERS VOCABULARY
-- ==========================================================================

-- --------------------------------------------------------------------------
-- TOPIC 1: IELTS Band 7.5 Topic Vocabulary
-- --------------------------------------------------------------------------
DO $$
DECLARE
    v_topic_id UUID := gen_random_uuid();
BEGIN
    -- Delete existing topic if exists
    DELETE FROM public.topics WHERE name = 'IELTS Band 7.5 Topic Vocabulary' AND user_id IS NULL;

    -- Insert topic
    INSERT INTO public.topics (id, user_id, name, icon, category, created_at)
    VALUES (v_topic_id, NULL, 'IELTS Band 7.5 Topic Vocabulary', 'psychology', 'IELTS', NOW() + interval '0 seconds');

    -- Lesson: Urbanization (18 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'metropolitan area', '/ˌmetrəˈpɒlɪtən ˈeəriə/', '(n) khu vực đô thị lớn', 'Rapid economic growth has attracted millions of workers to the metropolitan area.', 'Urbanization', 0, 1, NOW() + interval '1 seconds'),
    (v_topic_id, 'urban expansion', '/ˈɜːbən ɪkˈspænʃn/', '(n) sự mở rộng đô thị', 'Uncontrolled urban expansion often leads to the loss of valuable agricultural land.', 'Urbanization', 0, 2, NOW() + interval '2 seconds'),
    (v_topic_id, 'rural-to-urban migration', '/ˈrʊərəl tu ˈɜːbən maɪˈɡreɪʃn/', '(n) sự di cư từ nông thôn ra thành thị', 'Rural-to-urban migration has accelerated due to better job prospects in major cities.', 'Urbanization', 0, 3, NOW() + interval '3 seconds'),
    (v_topic_id, 'densely populated city', '/ˈdensli ˈpɒpjuleɪtɪd ˈsɪti/', '(n) thành phố đông dân', 'Living in a densely populated city can cause chronic stress and respiratory problems.', 'Urbanization', 0, 4, NOW() + interval '4 seconds'),
    (v_topic_id, 'housing shortages', '/ˈhaʊzɪŋ ˈʃɔːtɪdʒɪz/', '(n) thiếu hụt nhà ở', 'Severe housing shortages have driven property prices to unaffordable levels.', 'Urbanization', 0, 5, NOW() + interval '5 seconds'),
    (v_topic_id, 'public amenities', '/ˈpʌblɪk əˈmiːnətiz/', '(n) tiện ích công cộng', 'Local authorities must invest in public amenities such as libraries, parks, and clinics.', 'Urbanization', 0, 6, NOW() + interval '6 seconds'),
    (v_topic_id, 'mass transit systems', '/mæs ˈtrænzɪt ˈsɪstəmz/', '(n) hệ thống giao thông công cộng quy mô lớn', 'Modern mass transit systems help reduce reliance on private vehicles.', 'Urbanization', 0, 7, NOW() + interval '7 seconds'),
    (v_topic_id, 'urban development', '/ˈɜːbən dɪˈveləpmənt/', '(n) phát triển đô thị', 'Sustainable urban development balances economic progress with environmental protection.', 'Urbanization', 0, 8, NOW() + interval '8 seconds'),
    (v_topic_id, 'urban pollution', '/ˈɜːbən pəˈluːʃn/', '(n) ô nhiễm đô thị', 'Strict regulations are needed to curb urban pollution caused by industrial emissions.', 'Urbanization', 0, 9, NOW() + interval '9 seconds'),
    (v_topic_id, 'underdeveloped neighborhoods', '/ˌʌndədɪˈveləpt ˈneɪbəhʊdz/', '(n) khu vực kém phát triển, khu ổ chuột/vùng ven', 'Government subsidies are allocated to regenerate underdeveloped neighborhoods.', 'Urbanization', 0, 10, NOW() + interval '10 seconds'),
    (v_topic_id, 'enhance urban infrastructure', '/ɪnˈhɑːns ˈɜːbən ˈɪnfrəstrʌktʃə/', '(v) cải thiện cơ sở hạ tầng đô thị', 'City planners are working to enhance urban infrastructure to accommodate population growth.', 'Urbanization', 0, 11, NOW() + interval '11 seconds'),
    (v_topic_id, 'urban dwellers', '/ˈɜːbən ˈdweləz/', '(n) cư dân thành thị', 'Many urban dwellers experience high levels of noise pollution on a daily basis.', 'Urbanization', 0, 12, NOW() + interval '12 seconds'),
    (v_topic_id, 'urban overcrowding', '/ˈɜːbən ˌəʊvəˈkraʊdɪŋ/', '(n) tình trạng quá tải dân số đô thị', 'Urban overcrowding places enormous strain on healthcare and sanitation facilities.', 'Urbanization', 0, 13, NOW() + interval '13 seconds'),
    (v_topic_id, 'urban planning', '/ˈɜːbən ˈplænɪŋ/', '(n) quy hoạch đô thị', 'Effective urban planning is crucial for preventing traffic gridlock and pollution.', 'Urbanization', 0, 14, NOW() + interval '14 seconds'),
    (v_topic_id, 'public green spaces', '/ˈpʌblɪk ɡriːn ˈspeɪsɪz/', '(n) không gian xanh công cộng', 'Allocating land for public green spaces improves the mental wellbeing of residents.', 'Urbanization', 0, 15, NOW() + interval '15 seconds'),
    (v_topic_id, 'urban challenges', '/ˈɜːbən ˈtʃælɪndʒɪz/', '(n) các thách thức đô thị', 'Policymakers must address pressing urban challenges such as waste management and crime.', 'Urbanization', 0, 16, NOW() + interval '16 seconds'),
    (v_topic_id, 'urban quality of life', '/ˈɜːbən ˈkwɒləti əv laɪf/', '(n) chất lượng cuộc sống đô thị', 'Access to clean air and reliable public transport directly enhances urban quality of life.', 'Urbanization', 0, 17, NOW() + interval '17 seconds'),
    (v_topic_id, 'highly urbanized cities', '/ˈhaɪli ˈɜːbənaɪzd ˈsɪtiz/', '(n) các thành phố đô thị hóa cao', 'Highly urbanized cities often struggle with the urban heat island effect.', 'Urbanization', 0, 18, NOW() + interval '18 seconds');

    -- Lesson: Environment (16 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'preserve the environment', '/prɪˈzɜːv ði ɪnˈvaɪrənmənt/', '(v) bảo vệ môi trường', 'International cooperation is vital to preserve the environment for future generations.', 'Environment', 1, 1, NOW() + interval '51 seconds'),
    (v_topic_id, 'deforestation', '/diːˌfɒrɪˈsteɪʃn/', '(n) nạn phá rừng', 'Widespread deforestation in the Amazon basin threatens global biodiversity.', 'Environment', 1, 2, NOW() + interval '52 seconds'),
    (v_topic_id, 'atmospheric contamination', '/ˌætməsˈferɪk kənˌtæmɪˈneɪʃn/', '(n) ô nhiễm không khí / ô nhiễm khí quyển', 'Atmospheric contamination from heavy industries has resulted in frequent smog episodes.', 'Environment', 1, 3, NOW() + interval '53 seconds'),
    (v_topic_id, 'contribute to environmental sustainability', '/kənˈtrɪbjuːt tu ɪnˌvaɪrənˈmentl səˌsteɪnəˈbɪləti/', '(v) đóng góp vào sự bền vững môi trường', 'Adopting eco-friendly habits can substantially contribute to environmental sustainability.', 'Environment', 1, 4, NOW() + interval '54 seconds'),
    (v_topic_id, 'rely on private vehicles', '/rɪˈlaɪ ɒn ˈpraɪvət ˈviːəklz/', '(v) phụ thuộc vào phương tiện cá nhân', 'Citizens who rely on private vehicles contribute significantly to carbon emissions.', 'Environment', 1, 5, NOW() + interval '55 seconds'),
    (v_topic_id, 'excessive waste production', '/ɪkˈsesɪv weɪst prəˈdʌkʃn/', '(n) phát sinh chất thải quá mức', 'Excessive waste production in consumer societies has overwhelmed landfill capacities.', 'Environment', 1, 6, NOW() + interval '56 seconds'),
    (v_topic_id, 'harmful to the environment', '/ˈhɑːmfl tu ði ɪnˈvaɪrənmənt/', '(adj) có hại cho môi trường', 'Single-use plastics are extremely harmful to the environment and marine ecosystems.', 'Environment', 1, 7, NOW() + interval '57 seconds'),
    (v_topic_id, 'degrade air quality', '/dɪˈɡreɪd eə ˈkwɒləti/', '(v) làm suy giảm chất lượng không khí', 'Emissions from coal-fired power plants degrade air quality across neighboring regions.', 'Environment', 1, 8, NOW() + interval '58 seconds'),
    (v_topic_id, 'people show little environmental awareness', '/ˈpiːpl ʃəʊ ˈlɪtl ɪnˌvaɪrənˈmentl əˈweənəs/', 'người dân ít có ý thức bảo vệ môi trường', 'In many developing areas, people show little environmental awareness regarding waste sorting.', 'Environment', 1, 9, NOW() + interval '59 seconds'),
    (v_topic_id, 'reduce energy consumption', '/rɪˈdjuːs ˈenədʒi kənˈsʌmpʃn/', '(v) giảm tiêu thụ năng lượng', 'Using energy-efficient household appliances helps reduce energy consumption.', 'Environment', 1, 10, NOW() + interval '60 seconds'),
    (v_topic_id, 'protect endangered species', '/prəˈtekt ɪnˈdeɪndʒəd ˈspiːʃiːz/', '(v) bảo vệ các loài nguy cấp', 'National parks play a critical role in protecting endangered species from extinction.', 'Environment', 1, 11, NOW() + interval '61 seconds'),
    (v_topic_id, 'affect weather patterns', '/əˈfekt ˈweðə ˈpætənz/', '(v) ảnh hưởng đến các kiểu thời tiết', 'Global warming continues to affect weather patterns, triggering prolonged droughts.', 'Environment', 1, 12, NOW() + interval '62 seconds'),
    (v_topic_id, 'combat environmental pollution', '/ˈkɒmbæt ɪnˌvaɪrənˈmentl pəˈluːʃn/', '(v) chống ô nhiễm môi trường', 'Governments have pledged substantial funds to combat environmental pollution.', 'Environment', 1, 13, NOW() + interval '63 seconds'),
    (v_topic_id, 'detrimental to wildlife', '/ˌdetrɪˈmentl tu ˈwaɪldlaɪf/', '(adj) gây hại cho động vật hoang dã', 'Habitat fragmentation caused by highway construction is detrimental to wildlife.', 'Environment', 1, 14, NOW() + interval '64 seconds'),
    (v_topic_id, 'implement environmental regulations', '/ˈɪmplɪment ɪnˌvaɪrənˈmentl ˌreɡjuˈleɪʃnz/', '(v) thực thi các quy định về môi trường', 'Authorities must strictly implement environmental regulations on industrial discharge.', 'Environment', 1, 15, NOW() + interval '65 seconds'),
    (v_topic_id, 'utilize renewable energy sources', '/ˈjuːtəlaɪz rɪˈnjuːəbl ˈenədʒi ˈsɔːsɪz/', '(v) sử dụng các nguồn năng lượng tái tạo', 'Countries should utilize renewable energy sources like wind and solar to cut emissions.', 'Environment', 1, 16, NOW() + interval '66 seconds');

    -- Lesson: Crime & Law (15 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'engage in criminal activities', '/ɪnˈɡeɪdʒ ɪn ˈkrɪmɪnl ækˈtɪvətiz/', '(v) tham gia vào các hoạt động phạm tội', 'Unemployed youths are more susceptible to engaging in criminal activities.', 'Crime & Law', 2, 1, NOW() + interval '101 seconds'),
    (v_topic_id, 'deter criminal behaviour', '/dɪˈtɜː ˈkrɪmɪnl bɪˈheɪvjə/', '(v) ngăn chặn / răn đe hành vi phạm tội', 'Increased police presence in public spaces helps deter criminal behaviour.', 'Crime & Law', 2, 2, NOW() + interval '102 seconds'),
    (v_topic_id, 'impose harsher penalties', '/ɪmˈpəʊz ˈhɑːʃə ˈpenəltiz/', '(v) áp dụng hình phạt nghiêm khắc hơn', 'Courts are expected to impose harsher penalties on repeat offenders.', 'Crime & Law', 2, 3, NOW() + interval '103 seconds'),
    (v_topic_id, 'sentence offenders to imprisonment', '/ˈsentəns əˈfendəz tu ɪmˈprɪznmənt/', '(v) kết án tù đối với tội phạm', 'Judges should sentence offenders to imprisonment for serious violent offences.', 'Crime & Law', 2, 4, NOW() + interval '104 seconds'),
    (v_topic_id, 'violate legal regulations', '/ˈvaɪəleɪt ˈliːɡl ˌreɡjuˈleɪʃnz/', '(v) vi phạm pháp luật / quy định pháp lý', 'Companies that violate legal regulations must face heavy financial fines.', 'Crime & Law', 2, 5, NOW() + interval '105 seconds'),
    (v_topic_id, 'law enforcement authorities', '/lɔː ɪnˈfɔːsmənt ɔːˈθɒrətiz/', '(n) cơ quan thực thi pháp luật', 'Law enforcement authorities are investigating transnational cyber fraud syndicates.', 'Crime & Law', 2, 6, NOW() + interval '106 seconds'),
    (v_topic_id, 'rising crime rates', '/ˈraɪzɪŋ kraɪm reɪts/', '(n) tỷ lệ tội phạm gia tăng', 'Socioeconomic inequality is often identified as the root cause of rising crime rates.', 'Crime & Law', 2, 7, NOW() + interval '107 seconds'),
    (v_topic_id, 'violent offences', '/ˈvaɪələnt əˈfensɪz/', '(n) tội phạm bạo lực / các hành vi bạo lực', 'A zero-tolerance approach is required to combat violent offences in schools.', 'Crime & Law', 2, 8, NOW() + interval '108 seconds'),
    (v_topic_id, 'tackle crime effectively', '/ˈtækl kraɪm ɪˈfektɪvli/', '(v) giải quyết tình trạng tội phạm hiệu quả', 'Community policing programs have been proven to tackle crime effectively.', 'Crime & Law', 2, 9, NOW() + interval '109 seconds'),
    (v_topic_id, 'juvenile offenders', '/ˈdʒuːvənaɪl əˈfendəz/', '(n) tội phạm vị thành niên', 'Rehabilitation centers offer educational guidance to reintegrate juvenile offenders into society.', 'Crime & Law', 2, 10, NOW() + interval '110 seconds'),
    (v_topic_id, 'crime prevention measures', '/kraɪm prɪˈvenʃn ˈmeʒəz/', '(n) các biện pháp phòng chống tội phạm', 'Installing CCTV cameras is one of the most practical crime prevention measures.', 'Crime & Law', 2, 11, NOW() + interval '111 seconds'),
    (v_topic_id, 'comply with the law', '/kəmˈplaɪ wɪð ðə lɔː/', '(v) tuân thủ pháp luật', 'Every citizen is obligated to comply with the law regardless of their social status.', 'Crime & Law', 2, 12, NOW() + interval '112 seconds'),
    (v_topic_id, 'public security', '/ˈpʌblɪk sɪˈkjʊərəti/', '(n) an ninh công cộng', 'Maintaining public security is the foremost duty of municipal police forces.', 'Crime & Law', 2, 13, NOW() + interval '113 seconds'),
    (v_topic_id, 'investigate criminal cases', '/ɪnˈvestɪɡeɪt ˈkrɪmɪnl ˈkeɪsɪz/', '(v) điều tra các vụ án hình sự', 'Forensic science has revolutionized the way detectives investigate criminal cases.', 'Crime & Law', 2, 14, NOW() + interval '114 seconds'),
    (v_topic_id, 'reoffend', '/ˌriːəˈfend/', '(v) tái phạm', 'Without proper job training during imprisonment, ex-convicts are likely to reoffend.', 'Crime & Law', 2, 15, NOW() + interval '115 seconds');

    -- Lesson: Transportation (17 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'public transportation systems', '/ˈpʌblɪk ˌtrænspɔːˈteɪʃn ˈsɪstəmz/', '(n) hệ thống giao thông công cộng', 'Metropolitan governments must subsidize public transportation systems to encourage commuter usage.', 'Transportation', 3, 1, NOW() + interval '151 seconds'),
    (v_topic_id, 'traffic congestion', '/ˈtræfɪk kənˈdʒestʃən/', '(n) tắc nghẽn giao thông', 'Severe traffic congestion during rush hours leads to millions in economic losses.', 'Transportation', 3, 2, NOW() + interval '152 seconds'),
    (v_topic_id, 'a high volume of private vehicles', '/ə haɪ ˈvɒljuːm əv ˈpraɪvət ˈviːəklz/', '(n) số lượng lớn phương tiện cá nhân', 'A high volume of private vehicles on arterial roads causes daily gridlock.', 'Transportation', 3, 3, NOW() + interval '153 seconds'),
    (v_topic_id, 'rely on public transit', '/rɪˈlaɪ ɒn ˈpʌblɪk ˈtrænzɪt/', '(v) sử dụng / phụ thuộc phương tiện công cộng', 'In Tokyo, the majority of office workers rely on public transit for their daily commute.', 'Transportation', 3, 4, NOW() + interval '154 seconds'),
    (v_topic_id, 'transportation safety', '/ˌtrænspɔːˈteɪʃn ˈseɪfti/', '(n) an toàn giao thông', 'Strict speed limits have significantly improved transportation safety on expressways.', 'Transportation', 3, 5, NOW() + interval '155 seconds'),
    (v_topic_id, 'expand transport infrastructure', '/ɪkˈspænd ˈtrænspɔːt ˈɪnfrəstrʌktʃə/', '(v) mở rộng cơ sở hạ tầng giao thông', 'The government plans to expand transport infrastructure by building new ring roads.', 'Transportation', 3, 6, NOW() + interval '156 seconds'),
    (v_topic_id, 'alleviate traffic congestion', '/əˈliːvieɪt ˈtræfɪk kənˈdʒestʃən/', '(v) giảm ùn tắc giao thông', 'Introducing congestion pricing is an effective way to alleviate traffic congestion.', 'Transportation', 3, 7, NOW() + interval '157 seconds'),
    (v_topic_id, 'vehicle-related air pollution', '/ˈviːəkl rɪˈleɪtɪd eə pəˈluːʃn/', '(n) ô nhiễm không khí do phương tiện giao thông', 'Transitioning to electric buses helps curb vehicle-related air pollution in city centers.', 'Transportation', 3, 8, NOW() + interval '158 seconds'),
    (v_topic_id, 'lengthy commuting times', '/ˈleŋkθi kəˈmjuːtɪŋ taɪmz/', '(n) thời gian di chuyển dài', 'Lengthy commuting times negatively affect workers'' productivity and family life.', 'Transportation', 3, 9, NOW() + interval '159 seconds'),
    (v_topic_id, 'enhance transportation networks', '/ɪnˈhɑːns ˌtrænspɔːˈteɪʃn ˈnetwɜːks/', '(v) cải thiện mạng lưới giao thông', 'Integrating smart traffic lights will enhance transportation networks across the capital.', 'Transportation', 3, 10, NOW() + interval '160 seconds'),
    (v_topic_id, 'mass rapid transit system', '/mæs ˈræpɪd ˈtrænzɪt ˈsɪstəm/', '(n) hệ thống tàu điện ngầm / tàu điện tốc hành công cộng', 'Singapore''s mass rapid transit system is celebrated for its efficiency and punctuality.', 'Transportation', 3, 11, NOW() + interval '161 seconds'),
    (v_topic_id, 'promote the use of public transport', '/prəˈməʊt ðə juːs əv ˈpʌblɪk ˈtrænspɔːt/', '(v) khuyến khích sử dụng giao thông công cộng', 'Cheaper bus fares are introduced to promote the use of public transport among students.', 'Transportation', 3, 12, NOW() + interval '162 seconds'),
    (v_topic_id, 'an excessive number of vehicles', '/ən ɪkˈsesɪv ˈnʌmbə əv ˈviːəklz/', '(n) quá nhiều phương tiện giao thông', 'Narrow old streets cannot accommodate an excessive number of vehicles.', 'Transportation', 3, 13, NOW() + interval '163 seconds'),
    (v_topic_id, 'dedicated cycling lanes', '/ˈdedɪkeɪtɪd ˈsaɪklɪŋ leɪnz/', '(n) làn đường dành riêng cho xe đạp', 'Building dedicated cycling lanes encourages citizens to adopt healthier transport habits.', 'Transportation', 3, 14, NOW() + interval '164 seconds'),
    (v_topic_id, 'environmentally friendly vehicles', '/ɪnˌvaɪrənˈmentli ˈfrendli ˈviːəklz/', '(n) phương tiện thân thiện môi trường', 'Tax incentives are offered to buyers of environmentally friendly vehicles.', 'Transportation', 3, 15, NOW() + interval '165 seconds'),
    (v_topic_id, 'transportation-related challenges', '/ˌtrænspɔːˈteɪʃn rɪˈleɪtɪd ˈtʃælɪndʒɪz/', '(n) các vấn đề liên quan đến giao thông', 'Rapid urbanization creates numerous transportation-related challenges for developing cities.', 'Transportation', 3, 16, NOW() + interval '166 seconds'),
    (v_topic_id, 'transportation expenses', '/ˌtrænspɔːˈteɪʃn ɪkˈspensɪz/', '(n) chi phí đi lại', 'Rising fuel prices have increased daily transportation expenses for suburban commuters.', 'Transportation', 3, 17, NOW() + interval '167 seconds');

    -- Lesson: AI & Technology (14 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'leverage artificial intelligence', '/ˈliːvərɪdʒ ˌɑːtɪˈfɪʃl ɪnˈtelɪdʒəns/', '(v) tận dụng trí tuệ nhân tạo', 'Modern enterprises leverage artificial intelligence to automate customer support workflows.', 'AI & Technology', 4, 1, NOW() + interval '201 seconds'),
    (v_topic_id, 'cutting-edge AI technology', '/ˌkʌtɪŋ ˈedʒ eɪ aɪ tekˈnɒlədʒi/', '(n) công nghệ AI tiên tiến', 'The hospital employs cutting-edge AI technology to detect early-stage tumors.', 'AI & Technology', 4, 2, NOW() + interval '202 seconds'),
    (v_topic_id, 'enhance workplace productivity', '/ɪnˈhɑːns ˈwɜːkpleɪs ˌprɒdʌkˈtɪvəti/', '(v) nâng cao năng suất làm việc', 'Automating repetitive data entry tasks can drastically enhance workplace productivity.', 'AI & Technology', 4, 3, NOW() + interval '203 seconds'),
    (v_topic_id, 'automate human labor', '/ˈɔːtəmeɪt ˈhjuːmən ˈleɪbə/', '(v) tự động hóa lao động của con người', 'Manufacturing plants increasingly automate human labor to reduce operational expenses.', 'AI & Technology', 4, 4, NOW() + interval '204 seconds'),
    (v_topic_id, 'perform data-driven decision-making', '/pəˈfɔːm ˈdeɪtə ˈdrɪvn dɪˈsɪʒn ˈmeɪkɪŋ/', '(v) đưa ra quyết định dựa trên dữ liệu', 'Executives rely on predictive analytics to perform data-driven decision-making.', 'AI & Technology', 4, 5, NOW() + interval '205 seconds'),
    (v_topic_id, 'gather and process vast amounts of data', '/ˈɡæðə ænd ˈprəʊses vɑːst əˈmaʊnts əv ˈdeɪtə/', '(v) thu thập và xử lý lượng dữ liệu lớn', 'Neural networks can gather and process vast amounts of data in fractions of a second.', 'AI & Technology', 4, 6, NOW() + interval '206 seconds'),
    (v_topic_id, 'intelligent algorithms', '/ɪnˈtelɪdʒənt ˈælɡərɪðəmz/', '(n) các thuật toán thông minh', 'Streaming platforms utilize intelligent algorithms to curate personalized recommendations.', 'AI & Technology', 4, 7, NOW() + interval '207 seconds'),
    (v_topic_id, 'optimize operational efficiency', '/ˈɒptɪmaɪz ˌɒpəˈreɪʃənl ɪˈfɪʃnsi/', '(v) tối ưu hóa hiệu quả hoạt động', 'Logistics providers deploy machine learning to optimize operational efficiency.', 'AI & Technology', 4, 8, NOW() + interval '208 seconds'),
    (v_topic_id, 'minimize human error', '/ˈmɪnɪmaɪz ˈhjuːmən ˈerə/', '(v) giảm thiểu sai sót của con người', 'Automated accounting systems help minimize human error during financial auditing.', 'AI & Technology', 4, 9, NOW() + interval '209 seconds'),
    (v_topic_id, 'generate digital content', '/ˈdʒenəreɪt ˈdɪdʒɪtl ˈkɒntent/', '(v) tạo nội dung số', 'Generative models can now produce realistic images and generate digital content automatically.', 'AI & Technology', 4, 10, NOW() + interval '210 seconds'),
    (v_topic_id, 'analyze patterns in large datasets', '/ˈænəlaɪz ˈpætənz ɪn lɑːdʒ ˈdeɪtəsets/', '(v) phân tích các mẫu trong tập dữ liệu lớn', 'Data scientists analyze patterns in large datasets to forecast market trends.', 'AI & Technology', 4, 11, NOW() + interval '211 seconds'),
    (v_topic_id, 'safeguard sensitive information', '/ˈseɪfɡɑːd ˈsensətɪv ˌɪnfəˈmeɪʃn/', '(v) bảo vệ thông tin nhạy cảm', 'Cybersecurity protocols must be upgraded to safeguard sensitive information from hackers.', 'AI & Technology', 4, 12, NOW() + interval '212 seconds'),
    (v_topic_id, 'advancements in artificial intelligence', '/ədˈvɑːnsmənts ɪn ˌɑːtɪˈfɪʃl ɪnˈtelɪdʒəns/', '(n) những tiến bộ trong trí tuệ nhân tạo', 'Recent advancements in artificial intelligence are reshaping the global labor market.', 'AI & Technology', 4, 13, NOW() + interval '213 seconds'),
    (v_topic_id, 'AI-powered applications', '/eɪ aɪ ˈpaʊəd ˌæplɪˈkeɪʃnz/', '(n) các ứng dụng được hỗ trợ bởi AI', 'AI-powered applications are transforming education through personalized learning pathways.', 'AI & Technology', 4, 14, NOW() + interval '214 seconds');

    -- Lesson: Space Exploration (15 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'interplanetary travel', '/ˌɪntəˈplænɪtri ˈtrævl/', '(n) du hành liên hành tinh', 'Interplanetary travel presents immense biological challenges due to cosmic radiation.', 'Space Exploration', 5, 1, NOW() + interval '251 seconds'),
    (v_topic_id, 'aerospace research', '/ˈeərəʊspeɪs rɪˈsɜːtʃ/', '(n) nghiên cứu hàng không vũ trụ', 'Substantial funding is dedicated to aerospace research for deep-space missions.', 'Space Exploration', 5, 2, NOW() + interval '252 seconds'),
    (v_topic_id, 'conduct space exploration', '/kənˈdʌkt speɪs ˌekspləˈreɪʃn/', '(v) tiến hành khám phá không gian', 'International agencies collaborate to conduct space exploration beyond our solar system.', 'Space Exploration', 5, 3, NOW() + interval '253 seconds'),
    (v_topic_id, 'invest in space programs', '/ɪnˈvest ɪn speɪs ˈprəʊɡræmz/', '(v) đầu tư vào các chương trình không gian', 'Critics argue whether governments should invest in space programs while poverty persists.', 'Space Exploration', 5, 4, NOW() + interval '254 seconds'),
    (v_topic_id, 'scientific breakthroughs', '/ˌsaɪənˈtɪfɪk ˈbreɪkθruːz/', '(n) các đột phá khoa học', 'Telescope observations have led to groundbreaking scientific breakthroughs in astrophysics.', 'Space Exploration', 5, 5, NOW() + interval '255 seconds'),
    (v_topic_id, 'extraterrestrial life', '/ˌekstrətəˈrestriəl laɪf/', '(n) sự sống ngoài Trái Đất', 'The search for extraterrestrial life has focused on subsurface oceans on icy moons.', 'Space Exploration', 5, 6, NOW() + interval '256 seconds'),
    (v_topic_id, 'potentially habitable planets', '/pəˈtenʃəli ˈhæbɪtəbl ˈplænɪts/', '(n) các hành tinh có khả năng sinh sống', 'Astronomers have discovered several potentially habitable planets orbiting nearby stars.', 'Space Exploration', 5, 7, NOW() + interval '257 seconds'),
    (v_topic_id, 'aerospace technology', '/ˈeərəʊspeɪs tekˈnɒlədʒi/', '(n) công nghệ hàng không vũ trụ', 'Advances in aerospace technology have lowered the cost of satellite launches.', 'Space Exploration', 5, 8, NOW() + interval '258 seconds'),
    (v_topic_id, 'address pressing terrestrial issues', '/əˈdres ˈpresɪŋ təˈrestriəl ˈɪʃuːz/', '(v) giải quyết các vấn đề cấp bách trên Trái Đất', 'Some citizens believe leaders should prioritize addressing pressing terrestrial issues over Mars missions.', 'Space Exploration', 5, 9, NOW() + interval '259 seconds'),
    (v_topic_id, 'commercial space tourism', '/kəˈmɜːʃl speɪs ˈtʊərɪzəm/', '(n) du lịch vũ trụ thương mại', 'Commercial space tourism is becoming a reality for ultra-wealthy individuals.', 'Space Exploration', 5, 10, NOW() + interval '260 seconds'),
    (v_topic_id, 'establish human settlements beyond Earth', '/ɪˈstæblɪʃ ˈhjuːmən ˈsetlmənts bɪˈjɒnd ɜːθ/', '(v) xây dựng khu định cư ngoài Trái Đất', 'Visionary scientists aim to establish human settlements beyond Earth on Mars and the Moon.', 'Space Exploration', 5, 11, NOW() + interval '261 seconds'),
    (v_topic_id, 'national space initiatives', '/ˈnæʃnəl speɪs ɪˈnɪʃətɪvz/', '(n) các chương trình không gian quốc gia', 'Emerging economies are launching their own national space initiatives to foster innovation.', 'Space Exploration', 5, 12, NOW() + interval '262 seconds'),
    (v_topic_id, 'groundbreaking discovery', '/ˈɡraʊndbreɪkɪŋ dɪˈskʌvəri/', '(n) khám phá mang tính đột phá', 'Detecting water molecules on the lunar surface was a groundbreaking discovery.', 'Space Exploration', 5, 13, NOW() + interval '263 seconds'),
    (v_topic_id, 'cutting-edge technology', '/ˌkʌtɪŋ ˈedʒ tekˈnɒlədʒi/', '(n) công nghệ tiên tiến, tối tân', 'Deep-space probes rely on cutting-edge technology to withstand extreme temperatures.', 'Space Exploration', 5, 14, NOW() + interval '264 seconds'),
    (v_topic_id, 'the long-term survival of humanity', '/ðə ˈlɒŋ tɜːm səˈvaɪvl əv hjuːˈmænəti/', '(n) sự tồn tại lâu dài của nhân loại', 'Space colonization is viewed by some as an insurance policy for the long-term survival of humanity.', 'Space Exploration', 5, 15, NOW() + interval '265 seconds');

    -- Lesson: Shopping & Consumerism (20 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'engage in retail activities', '/ɪnˈɡeɪdʒ ɪn ˈriːteɪl ækˈtɪvətiz/', '(v) tham gia vào hoạt động mua sắm', 'Consumers increasingly engage in retail activities through mobile applications.', 'Shopping & Consumerism', 6, 1, NOW() + interval '301 seconds'),
    (v_topic_id, 'purchase consumer goods', '/ˈpɜːtʃəs kənˈsjuːmə ɡʊdz/', '(v) mua hàng hóa tiêu dùng', 'Higher disposable income enables households to purchase consumer goods more freely.', 'Shopping & Consumerism', 6, 2, NOW() + interval '302 seconds'),
    (v_topic_id, 'retail complex', '/ˈriːteɪl ˈkɒmpleks/', '(n) trung tâm mua sắm / khu phức hợp bán lẻ', 'The city center features a state-of-the-art retail complex with hundreds of stores.', 'Shopping & Consumerism', 6, 3, NOW() + interval '303 seconds'),
    (v_topic_id, 'e-commerce', '/ˈiː kɒmɜːs/', '(n) thương mại điện tử', 'The exponential rise of e-commerce has disrupted traditional brick-and-mortar retail.', 'Shopping & Consumerism', 6, 4, NOW() + interval '304 seconds'),
    (v_topic_id, 'make purchases', '/meɪk ˈpɜːtʃəsɪz/', '(v) chi tiêu / thực hiện giao dịch mua sắm', 'Shoppers can make purchases securely with one-click payment gateways.', 'Shopping & Consumerism', 6, 5, NOW() + interval '305 seconds'),
    (v_topic_id, 'affordable goods', '/əˈfɔːdəbl ɡʊdz/', '(n) sản phẩm giá phải chăng', 'Discount supermarkets provide affordable goods to budget-conscious households.', 'Shopping & Consumerism', 6, 6, NOW() + interval '306 seconds'),
    (v_topic_id, 'high-end products', '/ˌhaɪ ˈend ˈprɒdʌkts/', '(n) sản phẩm cao cấp', 'Luxury boutiques cater exclusively to customers seeking high-end products.', 'Shopping & Consumerism', 6, 7, NOW() + interval '307 seconds'),
    (v_topic_id, 'consumer', '/kənˈsjuːmə/', '(n) người tiêu dùng', 'Consumer rights laws protect individuals against misleading advertising.', 'Shopping & Consumerism', 6, 8, NOW() + interval '308 seconds'),
    (v_topic_id, 'consumer behavior', '/kənˈsjuːmə bɪˈheɪvjə/', '(n) hành vi tiêu dùng', 'Social media endorsements have a profound impact on modern consumer behavior.', 'Shopping & Consumerism', 6, 9, NOW() + interval '309 seconds'),
    (v_topic_id, 'engage in excessive consumption', '/ɪnˈɡeɪdʒ ɪn ɪkˈsesɪv kənˈsʌmpʃn/', '(v) tiêu dùng quá mức', 'Aggressive marketing encourages people to engage in excessive consumption.', 'Shopping & Consumerism', 6, 10, NOW() + interval '310 seconds'),
    (v_topic_id, 'product reliability', '/ˈprɒdʌkt rɪˌlaɪəˈbɪləti/', '(n) chất lượng / độ tin cậy của sản phẩm', 'Manufacturers prioritize product reliability to maintain positive customer reviews.', 'Shopping & Consumerism', 6, 11, NOW() + interval '311 seconds'),
    (v_topic_id, 'brand reputation', '/brænd ˌrepjuˈteɪʃn/', '(n) danh tiếng thương hiệu', 'Building a strong brand reputation requires years of consistent service excellence.', 'Shopping & Consumerism', 6, 12, NOW() + interval '312 seconds'),
    (v_topic_id, 'promotional offers', '/prəˈməʊʃənl ˈɒfəz/', '(n) chương trình khuyến mãi / ưu đãi', 'Retailers launch seasonal promotional offers to clear obsolete inventory.', 'Shopping & Consumerism', 6, 13, NOW() + interval '313 seconds'),
    (v_topic_id, 'customer experience', '/ˈkʌstəmər ɪkˈspɪəriəns/', '(n) trải nghiệm khách hàng', 'Personalized service is essential for delivering an exceptional customer experience.', 'Shopping & Consumerism', 6, 14, NOW() + interval '314 seconds'),
    (v_topic_id, 'purchasing decisions', '/ˈpɜːtʃəsɪŋ dɪˈsɪʒnz/', '(n) quyết định mua hàng', 'Online user ratings strongly dictate consumer purchasing decisions.', 'Shopping & Consumerism', 6, 15, NOW() + interval '315 seconds'),
    (v_topic_id, 'best-selling products', '/ˌbest ˈselɪŋ ˈprɒdʌkts/', '(n) sản phẩm bán chạy nhất', 'The company''s best-selling products account for over sixty percent of total revenue.', 'Shopping & Consumerism', 6, 16, NOW() + interval '316 seconds'),
    (v_topic_id, 'compulsive buying behavior', '/kəmˈpʌlsɪv ˈbaɪɪŋ bɪˈheɪvjə/', '(n) hành vi mua sắm cưỡng chế / nghiện mua sắm', 'Mental health professionals recognize compulsive buying behavior as a psychological disorder.', 'Shopping & Consumerism', 6, 17, NOW() + interval '317 seconds'),
    (v_topic_id, 'small-scale retailers', '/ˌsmɔːl ˈskeɪl ˈriːteɪləz/', '(n) cửa hàng bán lẻ nhỏ', 'Small-scale retailers struggle to compete with multinational e-commerce giants.', 'Shopping & Consumerism', 6, 18, NOW() + interval '318 seconds'),
    (v_topic_id, 'global brands', '/ˈɡləʊbl brændz/', '(n) thương hiệu toàn cầu', 'Global brands enjoy massive marketing budgets and worldwide recognition.', 'Shopping & Consumerism', 6, 19, NOW() + interval '319 seconds'),
    (v_topic_id, 'purchasing convenience', '/ˈpɜːtʃəsɪŋ kənˈviːniəns/', '(n) sự thuận tiện khi mua sắm', 'Doorstep delivery offers unparalleled purchasing convenience for busy urbanites.', 'Shopping & Consumerism', 6, 20, NOW() + interval '320 seconds');

END $$;

-- --------------------------------------------------------------------------
-- TOPIC 2: IELTS Writing Task 1 - Process Vocabulary
-- --------------------------------------------------------------------------
DO $$
DECLARE
    v_topic_id UUID := gen_random_uuid();
BEGIN
    -- Delete existing topic if exists
    DELETE FROM public.topics WHERE name = 'IELTS Writing Task 1 - Process Vocabulary' AND user_id IS NULL;

    -- Insert topic
    INSERT INTO public.topics (id, user_id, name, icon, category, created_at)
    VALUES (v_topic_id, NULL, 'IELTS Writing Task 1 - Process Vocabulary', 'linear_scale', 'IELTS', NOW() + interval '10 seconds');

    -- Lesson: 1. Giai đoạn bắt đầu (10 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'At the beginning', '/æt ðə bɪˈɡɪnɪŋ/', 'Ở đầu, bắt đầu', 'At the beginning of the process, seeds are planted in the ground.', '1. Giai đoạn bắt đầu', 0, 1, NOW() + interval '1001 seconds'),
    (v_topic_id, 'At the outset', '/æt ði ˈaʊtset/', 'Ngay từ đầu', 'At the outset, raw materials are cleaned carefully.', '1. Giai đoạn bắt đầu', 0, 2, NOW() + interval '1002 seconds'),
    (v_topic_id, 'Begin', '/bɪˈɡɪn/', '(v) Bắt đầu', 'The process begins with clay being dug from the ground.', '1. Giai đoạn bắt đầu', 0, 3, NOW() + interval '1003 seconds'),
    (v_topic_id, 'Commence', '/kəˈmens/', '(v) Khởi đầu', 'The procedure commences with the combination of various elements.', '1. Giai đoạn bắt đầu', 0, 4, NOW() + interval '1004 seconds'),
    (v_topic_id, 'First', '/fɜːst/', '(adv) Đầu tiên', 'First, the ingredients are mixed together.', '1. Giai đoạn bắt đầu', 0, 5, NOW() + interval '1005 seconds'),
    (v_topic_id, 'Initially', '/ɪˈnɪʃəli/', '(adv) Ban đầu, lúc đầu', 'Initially, limestone is crushed into powder.', '1. Giai đoạn bắt đầu', 0, 6, NOW() + interval '1006 seconds'),
    (v_topic_id, 'Initial stages', '/ɪˈnɪʃl ˈsteɪdʒɪz/', '(n) Giai đoạn ban đầu', 'During the initial stages, the water is purified.', '1. Giai đoạn bắt đầu', 0, 7, NOW() + interval '1007 seconds'),
    (v_topic_id, 'Initial step', '/ɪˈnɪʃl step/', '(n) Bước đầu tiên', 'The initial step involves shaping the molten glass.', '1. Giai đoạn bắt đầu', 0, 8, NOW() + interval '1008 seconds'),
    (v_topic_id, 'Start', '/stɑːt/', '(v) Bắt đầu', 'The process starts when the materials are heated to high temperatures.', '1. Giai đoạn bắt đầu', 0, 9, NOW() + interval '1009 seconds'),
    (v_topic_id, 'To begin with', '/tu bɪˈɡɪn wɪð/', 'Để bắt đầu', 'To begin with, all items are sorted by size.', '1. Giai đoạn bắt đầu', 0, 10, NOW() + interval '1010 seconds');

    -- Lesson: 2. Giai đoạn phát triển & biến đổi (10 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'Adapt', '/əˈdæpt/', '(v) Thích nghi', 'The system adapts to new production requirements.', '2. Giai đoạn phát triển & biến đổi', 1, 1, NOW() + interval '1051 seconds'),
    (v_topic_id, 'Alter', '/ˈɔːltə/', '(v) Thay đổi, biến đổi', 'The shape of the product is altered during this step.', '2. Giai đoạn phát triển & biến đổi', 1, 2, NOW() + interval '1052 seconds'),
    (v_topic_id, 'Change', '/tʃeɪndʒ/', '(v) Thay đổi', 'The layout changes as more machines are added.', '2. Giai đoạn phát triển & biến đổi', 1, 3, NOW() + interval '1053 seconds'),
    (v_topic_id, 'Develop', '/dɪˈveləp/', '(v) Phát triển', 'The procedure develops from manual to fully automated over time.', '2. Giai đoạn phát triển & biến đổi', 1, 4, NOW() + interval '1054 seconds'),
    (v_topic_id, 'Enhance', '/ɪnˈhɑːns/', '(v) Nâng cao, cải thiện', 'The process is enhanced to produce better quality output.', '2. Giai đoạn phát triển & biến đổi', 1, 5, NOW() + interval '1055 seconds'),
    (v_topic_id, 'Evolve', '/ɪˈvɒlv/', '(v) Tiến hóa, phát triển dần', 'The system evolves into a more efficient production line.', '2. Giai đoạn phát triển & biến đổi', 1, 6, NOW() + interval '1056 seconds'),
    (v_topic_id, 'Improve', '/ɪmˈpruːv/', '(v) Cải thiện', 'Several steps are improved to reduce time and cost.', '2. Giai đoạn phát triển & biến đổi', 1, 7, NOW() + interval '1057 seconds'),
    (v_topic_id, 'Modify', '/ˈmɒdɪfaɪ/', '(v) Sửa đổi, điều chỉnh', 'The packaging method is modified to meet new standards.', '2. Giai đoạn phát triển & biến đổi', 1, 8, NOW() + interval '1058 seconds'),
    (v_topic_id, 'Shift', '/ʃɪft/', '(v) Dịch chuyển, thay đổi', 'There is a shift from traditional to digital processing.', '2. Giai đoạn phát triển & biến đổi', 1, 9, NOW() + interval '1059 seconds'),
    (v_topic_id, 'Transform', '/trænsˈfɔːm/', '(v) Biến đổi hoàn toàn', 'Waste materials are transformed into reusable products.', '2. Giai đoạn phát triển & biến đổi', 1, 10, NOW() + interval '1060 seconds');

    -- Lesson: 3. Giai đoạn kết thúc (10 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'At the end', '/æt ði end/', 'Ở cuối', 'At the end of the process, the items are packed and ready for use.', '3. Giai đoạn kết thúc', 2, 1, NOW() + interval '1101 seconds'),
    (v_topic_id, 'At the final stage', '/æt ðə ˈfaɪnl steɪdʒ/', 'Ở giai đoạn cuối', 'At the final stage, the finished products are labeled.', '3. Giai đoạn kết thúc', 2, 2, NOW() + interval '1102 seconds'),
    (v_topic_id, 'Complete', '/kəmˈpliːt/', '(v) Hoàn thành', 'The process is complete when the goods are delivered.', '3. Giai đoạn kết thúc', 2, 3, NOW() + interval '1103 seconds'),
    (v_topic_id, 'Conclude', '/kənˈkluːd/', '(v) Kết thúc, khép lại', 'The sequence concludes with a drying step.', '3. Giai đoạn kết thúc', 2, 4, NOW() + interval '1104 seconds'),
    (v_topic_id, 'End', '/end/', '(v) Kết thúc', 'The system ends with the final storage of materials.', '3. Giai đoạn kết thúc', 2, 5, NOW() + interval '1105 seconds'),
    (v_topic_id, 'Final step', '/ˈfaɪnl step/', '(n) Bước cuối cùng', 'The final step includes checking the product quality.', '3. Giai đoạn kết thúc', 2, 6, NOW() + interval '1106 seconds'),
    (v_topic_id, 'Finalize', '/ˈfaɪnəlaɪz/', '(v) Hoàn tất, hoàn thiện', 'The production is finalized by sealing the containers.', '3. Giai đoạn kết thúc', 2, 7, NOW() + interval '1107 seconds'),
    (v_topic_id, 'Finally', '/ˈfaɪnəli/', '(adv) Cuối cùng', 'Finally, all units are inspected before dispatch.', '3. Giai đoạn kết thúc', 2, 8, NOW() + interval '1108 seconds'),
    (v_topic_id, 'Finish', '/ˈfɪnɪʃ/', '(v) Hoàn tất, kết thúc', 'The cycle finishes after the packaging is completed.', '3. Giai đoạn kết thúc', 2, 9, NOW() + interval '1109 seconds'),
    (v_topic_id, 'Ultimately', '/ˈʌltɪmətli/', '(adv) Sau cùng, cuối cùng', 'Ultimately, the waste is treated before disposal.', '3. Giai đoạn kết thúc', 2, 10, NOW() + interval '1110 seconds');

    -- Lesson: 4. So sánh trong Process & Map (8 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'Compared to', '/kəmˈpeəd tu/', '(prep) So với', 'The modern method is more time-saving compared to the traditional one.', '4. So sánh trong Process & Map', 3, 1, NOW() + interval '1151 seconds'),
    (v_topic_id, 'Different', '/ˈdɪfrənt/', '(adj) Khác nhau', 'The two procedures are different in how they handle waste materials.', '4. So sánh trong Process & Map', 3, 2, NOW() + interval '1152 seconds'),
    (v_topic_id, 'In contrast', '/ɪn ˈkɒntrɑːst/', 'Ngược lại', 'In contrast, the second phase uses cold water instead of hot.', '4. So sánh trong Process & Map', 3, 3, NOW() + interval '1153 seconds'),
    (v_topic_id, 'On the other hand', '/ɒn ði ˈʌðə hænd/', 'Mặt khác', 'The first machine produces faster results; on the other hand, the second one ensures higher precision.', '4. So sánh trong Process & Map', 3, 4, NOW() + interval '1154 seconds'),
    (v_topic_id, 'Similar', '/ˈsɪmələ/', '(adj) Tương tự', 'Both systems are similar in their initial setup.', '4. So sánh trong Process & Map', 3, 5, NOW() + interval '1155 seconds'),
    (v_topic_id, 'Similarly', '/ˈsɪmələli/', '(adv) Tương tự như vậy', 'Similarly, the liquid is stored in tanks before distribution.', '4. So sánh trong Process & Map', 3, 6, NOW() + interval '1156 seconds'),
    (v_topic_id, 'Unlike', '/ʌnˈlaɪk/', '(prep) Không giống như', 'Unlike the first version, the updated version includes a filtering process.', '4. So sánh trong Process & Map', 3, 7, NOW() + interval '1157 seconds'),
    (v_topic_id, 'Whereas', '/weərˈæz/', '(conj) Trong khi', 'Whereas the previous model required manual input, the new version is fully automated.', '4. So sánh trong Process & Map', 3, 8, NOW() + interval '1158 seconds');

    -- Lesson: 5. Các giai đoạn & Trình tự (9 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'Initial stage', '/ɪˈnɪʃl steɪdʒ/', '(n) Giai đoạn ban đầu', 'In the initial stage, raw materials are collected from the warehouse.', '5. Các giai đoạn & Trình tự', 4, 1, NOW() + interval '1201 seconds'),
    (v_topic_id, 'Subsequent step', '/ˈsʌbsɪkwənt step/', '(n) Bước tiếp theo', 'The subsequent step involves shaping the mixture into blocks.', '5. Các giai đoạn & Trình tự', 4, 2, NOW() + interval '1202 seconds'),
    (v_topic_id, 'Intermediate phase', '/ˌɪntəˈmiːdiət feɪz/', '(n) Giai đoạn trung gian', 'During the intermediate phase, the product is cooled before packaging.', '5. Các giai đoạn & Trình tự', 4, 3, NOW() + interval '1203 seconds'),
    (v_topic_id, 'Final stage', '/ˈfaɪnl steɪdʒ/', '(n) Giai đoạn cuối cùng', 'The final stage includes labeling and sealing the products.', '5. Các giai đoạn & Trình tự', 4, 4, NOW() + interval '1204 seconds'),
    (v_topic_id, 'Sequential process', '/sɪˈkwenʃl ˈprəʊses/', '(n) Quá trình tuần tự', 'The entire production follows a sequential process with six distinct steps.', '5. Các giai đoạn & Trình tự', 4, 5, NOW() + interval '1205 seconds'),
    (v_topic_id, 'Parallel steps', '/ˈpærəlel steps/', '(n) Các bước song song', 'In the factory, parallel steps like drying and molding occur at the same time.', '5. Các giai đoạn & Trình tự', 4, 6, NOW() + interval '1206 seconds'),
    (v_topic_id, 'Simultaneous stages', '/ˌsɪmlˈteɪniəs ˈsteɪdʒɪz/', '(n) Các giai đoạn đồng thời', 'The system performs simultaneous stages such as heating and compressing.', '5. Các giai đoạn & Trình tự', 4, 7, NOW() + interval '1207 seconds'),
    (v_topic_id, 'Consecutive phases', '/kənˈsekjətɪv ˈfeɪzɪz/', '(n) Các giai đoạn liên tiếp', 'The product goes through several consecutive phases before becoming usable.', '5. Các giai đoạn & Trình tự', 4, 8, NOW() + interval '1208 seconds'),
    (v_topic_id, 'Initial setup', '/ɪˈnɪʃl ˈsetʌp/', '(n) Thiết lập ban đầu', 'The initial setup consists of arranging the equipment in proper order.', '5. Các giai đoạn & Trình tự', 4, 9, NOW() + interval '1209 seconds');

    -- Lesson: 6. Collocations & Idioms cho Process (10 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'Carry out', '/ˈkæri aʊt/', '(v) Tiến hành, thực hiện', 'The engineers carry out several tests before production begins.', '6. Collocations & Idioms cho Process', 5, 1, NOW() + interval '1251 seconds'),
    (v_topic_id, 'Undergo', '/ˌʌndəˈɡəʊ/', '(v) Trải qua (một quá trình)', 'The raw materials undergo multiple purification steps.', '6. Collocations & Idioms cho Process', 5, 2, NOW() + interval '1252 seconds'),
    (v_topic_id, 'Take place', '/teɪk pleɪs/', '(v) Diễn ra', 'The final process takes place in a temperature-controlled room.', '6. Collocations & Idioms cho Process', 5, 3, NOW() + interval '1253 seconds'),
    (v_topic_id, 'Key factor', '/kiː ˈfæktə/', '(n) Yếu tố quan trọng / then chốt', 'Quality control is a key factor throughout the process.', '6. Collocations & Idioms cho Process', 5, 4, NOW() + interval '1254 seconds'),
    (v_topic_id, 'Break the mold', '/breɪk ðə məʊld/', 'Phá vỡ khuôn mẫu truyền thống', 'This method breaks the mold by using AI instead of manual steps.', '6. Collocations & Idioms cho Process', 5, 5, NOW() + interval '1255 seconds'),
    (v_topic_id, 'By stages', '/baɪ ˈsteɪdʒɪz/', 'Theo từng giai đoạn', 'The factory expansion is carried out by stages over two years.', '6. Collocations & Idioms cho Process', 5, 6, NOW() + interval '1256 seconds'),
    (v_topic_id, 'From start to finish', '/frəm stɑːt tu ˈfɪnɪʃ/', 'Từ đầu đến cuối', 'The entire workflow is monitored from start to finish.', '6. Collocations & Idioms cho Process', 5, 7, NOW() + interval '1257 seconds'),
    (v_topic_id, 'In a linear fashion', '/ɪn ə ˈlɪniə ˈfæʃn/', 'Theo cách tuyến tính, tuần tự', 'Tasks are completed in a linear fashion without overlap.', '6. Collocations & Idioms cho Process', 5, 8, NOW() + interval '1258 seconds'),
    (v_topic_id, 'In sequence', '/ɪn ˈsiːkwəns/', 'Theo trình tự', 'Each phase is executed in sequence to avoid errors.', '6. Collocations & Idioms cho Process', 5, 9, NOW() + interval '1259 seconds'),
    (v_topic_id, 'In turn', '/ɪn tɜːn/', 'Lần lượt', 'The liquids are added in turn to prevent overflow.', '6. Collocations & Idioms cho Process', 5, 10, NOW() + interval '1260 seconds');

END $$;

-- --------------------------------------------------------------------------
-- TOPIC 3: 25 Từ định lượng phổ biến (Quantifiers)
-- --------------------------------------------------------------------------
DO $$
DECLARE
    v_topic_id UUID := gen_random_uuid();
BEGIN
    -- Delete existing topic if exists
    DELETE FROM public.topics WHERE name = '25 Từ định lượng phổ biến (Quantifiers)' AND user_id IS NULL;

    -- Insert topic
    INSERT INTO public.topics (id, user_id, name, icon, category, created_at)
    VALUES (v_topic_id, NULL, '25 Từ định lượng phổ biến (Quantifiers)', 'format_list_numbered', 'IELTS', NOW() + interval '20 seconds');

    -- Lesson: 25 Từ định lượng thông dụng (25 items)
    INSERT INTO public.words (topic_id, word, phonetic, meaning, example_sentence, lesson_name, lesson_order, word_order, created_at) VALUES
    (v_topic_id, 'a piece of', '/ə piːs əv/', 'Một mẩu, một miếng', 'She offered me a delicious piece of homemade chocolate cake.', '25 Từ định lượng thông dụng', 0, 1, NOW() + interval '2001 seconds'),
    (v_topic_id, 'a slice of', '/ə slaɪs əv/', 'Một lát', 'He toasted a slice of whole-grain bread for breakfast.', '25 Từ định lượng thông dụng', 0, 2, NOW() + interval '2002 seconds'),
    (v_topic_id, 'a loaf of', '/ə ləʊf əv/', 'Một ổ (bánh mì)', 'I bought a fresh loaf of sourdough bread from the local bakery.', '25 Từ định lượng thông dụng', 0, 3, NOW() + interval '2003 seconds'),
    (v_topic_id, 'a bar of', '/ə bɑːr əv/', 'Một thanh (sô cô la / xà phòng)', 'She bought a bar of dark chocolate to share with friends.', '25 Từ định lượng thông dụng', 0, 4, NOW() + interval '2004 seconds'),
    (v_topic_id, 'a bottle of', '/ə ˈbɒtl əv/', 'Một chai', 'Always keep a bottle of mineral water with you when exercising.', '25 Từ định lượng thông dụng', 0, 5, NOW() + interval '2005 seconds'),
    (v_topic_id, 'a cup of', '/ə kʌp əv/', 'Một tách, một cốc', 'He enjoys drinking a warm cup of green tea every morning.', '25 Từ định lượng thông dụng', 0, 6, NOW() + interval '2006 seconds'),
    (v_topic_id, 'a glass of', '/ə ɡlɑːs əv/', 'Một ly (thủy tinh)', 'The waiter brought a cold glass of freshly squeezed orange juice.', '25 Từ định lượng thông dụng', 0, 7, NOW() + interval '2007 seconds'),
    (v_topic_id, 'a can of', '/ə kæn əv/', 'Một lon', 'He cracked open a refreshing can of sparkling soda after workout.', '25 Từ định lượng thông dụng', 0, 8, NOW() + interval '2008 seconds'),
    (v_topic_id, 'a box of', '/ə bɒks əv/', 'Một hộp', 'She purchased a box of whole-grain cereal for the family.', '25 Từ định lượng thông dụng', 0, 9, NOW() + interval '2009 seconds'),
    (v_topic_id, 'a jar of', '/ə dʒɑːr əv/', 'Một hũ, một lọ', 'Grandmother prepared a jar of homemade strawberry jam.', '25 Từ định lượng thông dụng', 0, 10, NOW() + interval '2010 seconds'),
    (v_topic_id, 'a tube of', '/ə tjuːb əv/', 'Một tuýp', 'Don''t forget to pack a travel-sized tube of toothpaste in your luggage.', '25 Từ định lượng thông dụng', 0, 11, NOW() + interval '2011 seconds'),
    (v_topic_id, 'a spoonful of', '/ə ˈspuːnfʊl əv/', 'Một thìa, một muỗng', 'Add a spoonful of brown sugar to sweeten the coffee.', '25 Từ định lượng thông dụng', 0, 12, NOW() + interval '2012 seconds'),
    (v_topic_id, 'a handful of', '/ə ˈhændfʊl əv/', 'Một nắm', 'Snacking on a handful of roasted mixed nuts provides healthy fats.', '25 Từ định lượng thông dụng', 0, 13, NOW() + interval '2013 seconds'),
    (v_topic_id, 'a drop of', '/ə drɒp əv/', 'Một giọt', 'Just a single drop of essential oil will perfume the entire room.', '25 Từ định lượng thông dụng', 0, 14, NOW() + interval '2014 seconds'),
    (v_topic_id, 'a pinch of', '/ə pɪntʃ əv/', 'Một nhúm', 'Season the simmering soup with a pinch of sea salt and black pepper.', '25 Từ định lượng thông dụng', 0, 15, NOW() + interval '2015 seconds'),
    (v_topic_id, 'a bag of', '/ə bæɡ əv/', 'Một túi, một bịch', 'The baker emptied a 5-kilogram bag of wheat flour into the mixing bowl.', '25 Từ định lượng thông dụng', 0, 16, NOW() + interval '2016 seconds'),
    (v_topic_id, 'a bunch of', '/ə bʌntʃ əv/', 'Một chùm, một bó', 'He bought a fresh bunch of ripe seedless grapes at the farmer''s market.', '25 Từ định lượng thông dụng', 0, 17, NOW() + interval '2017 seconds'),
    (v_topic_id, 'a clove of', '/ə kləʊv əv/', 'Một tép (tỏi)', 'Crush a clove of fresh garlic to release its natural aroma before cooking.', '25 Từ định lượng thông dụng', 0, 18, NOW() + interval '2018 seconds'),
    (v_topic_id, 'a head of', '/ə hed əv/', 'Một cây, một bắp (xà lách, cải bắp)', 'She finely shredded a crisp head of green lettuce for the garden salad.', '25 Từ định lượng thông dụng', 0, 19, NOW() + interval '2019 seconds'),
    (v_topic_id, 'a tin of', '/ə tɪn əv/', 'Một hộp (thiếc)', 'He prepared a quick pasta lunch using a tin of tuna in olive oil.', '25 Từ định lượng thông dụng', 0, 20, NOW() + interval '2020 seconds'),
    (v_topic_id, 'a roll of', '/ə rəʊl əv/', 'Một cuộn', 'Please replace the empty roll of paper towels in the kitchen.', '25 Từ định lượng thông dụng', 0, 21, NOW() + interval '2021 seconds'),
    (v_topic_id, 'a lump of', '/ə lʌmp əv/', 'Một viên, một cục (đường / than)', 'He dropped a lump of cane sugar into his steaming espresso.', '25 Từ định lượng thông dụng', 0, 22, NOW() + interval '2022 seconds'),
    (v_topic_id, 'a stick of', '/ə stɪk əv/', 'Một thỏi (bơ / kẹo)', 'The recipe calls for a softened stick of unsalted butter.', '25 Từ định lượng thông dụng', 0, 23, NOW() + interval '2023 seconds'),
    (v_topic_id, 'a scoop of', '/ə skuːp əv/', 'Một muỗng, một viên (kem)', 'The dessert was served with a generous scoop of vanilla ice cream.', '25 Từ định lượng thông dụng', 0, 24, NOW() + interval '2024 seconds'),
    (v_topic_id, 'a grain of', '/ə ɡreɪn əv/', 'Một hạt (gạo / cát / sự thật)', 'Not a single grain of rice was wasted during the traditional meal.', '25 Từ định lượng thông dụng', 0, 25, NOW() + interval '2025 seconds');

END $$;
