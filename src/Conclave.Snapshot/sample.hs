doubleMe x = x + x
doubleUs x y = doubleMe x + doubleMe y
doubleSmallNumber x = if x > 100 then x else x * 2



rightTriangles = [(a,b,c) | c <- [1..50], b <- [1..c], a <- [1..b], a^2 + b^2 == c^2, a+b+c == 24]